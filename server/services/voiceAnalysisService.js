const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const UserAnswer = require("../models/UserAnswer");
const VoiceAnalysis = require("../models/VoiceAnalysis");

dotenv.config({ path: ".env" });

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || "";

const assemblyai = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: ASSEMBLYAI_API_KEY,
    "content-type": "application/json",
  },
});

async function uploadToAssemblyAI(filePath) {
  console.log(
    `[VoiceAnalysis] 파일 업로드 시작: ${path.basename(filePath)} (${filePath})`
  );
  const fileData = await fs.promises.readFile(filePath);
  const uploadResponse = await assemblyai.post("/upload", fileData, {
    headers: { "content-type": "application/octet-stream" },
  });
  console.log("[VoiceAnalysis] 파일 업로드 완료");
  return uploadResponse.data.upload_url;
}

async function requestTranscript(uploadUrl) {
  console.log("[VoiceAnalysis] 전사 요청 전송");
  const transcriptResponse = await assemblyai.post("/transcript", {
    audio_url: uploadUrl,
    sentiment_analysis: true,
  });
  console.log(
    `[VoiceAnalysis] 전사 요청 접수 - 작업 ID: ${transcriptResponse.data.id}`
  );
  return transcriptResponse.data.id;
}

async function pollTranscript(transcriptId) {
  // 최대 60회(약 3분) 폴링
  for (let i = 0; i < 60; i += 1) {
    const pollResponse = await assemblyai.get(`/transcript/${transcriptId}`);
    const status = pollResponse.data.status;
    if (i === 0 || i % 5 === 0) {
      console.log(
        `[VoiceAnalysis] 폴링 중 - 작업 ID: ${transcriptId}, 상태: ${status}`
      );
    }
    if (status === "completed") return pollResponse.data;
    if (status === "error")
      throw new Error(pollResponse.data.error || "AssemblyAI error");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("AssemblyAI polling timeout");
}

function extractVoiceMetrics(assemblyResult) {
  const sentimentResult =
    (assemblyResult.sentiment_analysis_results || []).find(
      (r) => r.sentiment !== "NEUTRAL"
    ) ||
    (assemblyResult.sentiment_analysis_results || [])[0] ||
    null;

  const words = Array.isArray(assemblyResult.words) ? assemblyResult.words : [];
  const fillerCount = words.filter((w) => w.word_type === "filler").length;

  return {
    pronunciation_score:
      typeof assemblyResult.confidence === "number"
        ? Number(assemblyResult.confidence.toFixed(2))
        : null,
    emotion: sentimentResult ? sentimentResult.sentiment : null,
    speed_wpm: assemblyResult.words_per_minute ?? null,
    filler_count: fillerCount,
    pitch_variation: 0.0,
  };
}

function resolveAudioAbsolutePath(audioPath) {
  if (!audioPath) return null;
  const candidates = [
    audioPath,
    path.isAbsolute(audioPath)
      ? audioPath
      : path.join(__dirname, "../controllers/audio_files", audioPath),
    path.isAbsolute(audioPath)
      ? audioPath
      : path.join(__dirname, "../controllers/audio_files_AI", audioPath),
  ];
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

async function analyzeAndSaveForAnswer(answer) {
  if (!ASSEMBLYAI_API_KEY) {
    return { success: false, error: "ASSEMBLYAI_API_KEY 미설정", data: null };
  }

  const absolutePath = resolveAudioAbsolutePath(answer.audio_path);
  if (!absolutePath) {
    return {
      success: false,
      error: "오디오 파일 경로를 찾을 수 없습니다.",
      data: null,
    };
  }

  console.log(
    `[VoiceAnalysis] 분석 시작 - answer_id: ${answer.id}, 파일: ${path.basename(
      absolutePath
    )}`
  );
  const uploadUrl = await uploadToAssemblyAI(absolutePath);
  const transcriptId = await requestTranscript(uploadUrl);
  const result = await pollTranscript(transcriptId);
  const metrics = extractVoiceMetrics(result);
  console.log(
    `[VoiceAnalysis] 분석 완료 - answer_id: ${answer.id}, ` +
      `pronunciation_score: ${metrics.pronunciation_score}, ` +
      `emotion: ${metrics.emotion}, ` +
      `speed_wpm: ${metrics.speed_wpm}, ` +
      `filler_count: ${metrics.filler_count}, ` +
      `pitch_variation: ${metrics.pitch_variation}`
  );

  // upsert: 기존 존재하면 update, 없으면 create
  const existing = await VoiceAnalysis.findByAnswerId(answer.id);
  if (existing) {
    await VoiceAnalysis.update(answer.id, metrics);
    console.log(`[VoiceAnalysis] DB 업데이트 완료 - answer_id: ${answer.id}`);
  } else {
    await VoiceAnalysis.create({
      answer_id: answer.id,
      ...metrics,
    });
    console.log(`[VoiceAnalysis] DB 저장 완료 - answer_id: ${answer.id}`);
  }

  return { success: true, data: { answer_id: answer.id, ...metrics } };
}

async function analyzeAllAnswersInSession(sessionId) {
  console.log(`[VoiceAnalysis] 세션 분석 시작 - session_id: ${sessionId}`);
  const answers = await UserAnswer.getSessionAnswersWithAnalysis(sessionId);
  console.log(
    `[VoiceAnalysis] 세션 답변 수: ${answers.length}. 미분석 답변만 처리합니다.`
  );
  const results = [];
  for (const answer of answers) {
    try {
      const hasMetrics =
        typeof answer.pronunciation_score === "number" ||
        typeof answer.speed_wpm === "number" ||
        typeof answer.filler_count === "number";
      if (hasMetrics) {
        console.log(
          `[VoiceAnalysis] 스킵 - answer_id: ${answer.id} (이미 분석됨)`
        );
        continue;
      }
      if (!answer.audio_path) {
        console.log(
          `[VoiceAnalysis] 스킵 - answer_id: ${answer.id} (오디오 경로 없음)`
        );
        continue;
      }
      const r = await analyzeAndSaveForAnswer(answer);
      results.push(r);
    } catch (e) {
      console.warn(
        `[VoiceAnalysis] 분석 실패 - answer_id: ${answer.id}, 오류: ${e.message}`
      );
      results.push({
        success: false,
        error: e.message,
        data: null,
        answer_id: answer.id,
      });
    }
  }
  console.log(
    `[VoiceAnalysis] 세션 분석 완료 - session_id: ${sessionId}, 처리 건수: ${results.length}`
  );
  return results;
}

module.exports = {
  analyzeAllAnswersInSession,
  analyzeAndSaveForAnswer,
};
