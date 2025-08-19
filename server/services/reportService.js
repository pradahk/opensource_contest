const dotenv = require("dotenv");
const crypto = require("crypto");
const Report = require("../models/Report");
const InterviewSession = require("../models/InterviewSession");
const UserAnswer = require("../models/UserAnswer");
const User = require("../models/User");
const SelfIntroduction = require("../models/SelfIntroduction");
const Resume = require("../models/Resume");
const UnifiedVoiceAnalysisService = require("./unifiedVoiceAnalysisService");

let openai = null;
try {
  dotenv.config({ path: ".env" });
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

async function generateFinalMarkdownForSession(sessionId, userId) {
  // 세션 확인
  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  // 누락된 음성 분석 수행 (가능하면)
  try {
    await UnifiedVoiceAnalysisService.analyzeSessionAnswers(
      sessionId,
      "regular"
    );
  } catch (e) {
    console.warn("세션 음성 분석 중 경고:", e.message);
  }

  // 답변+분석 조회 및 프롬프트 입력 데이터 구성
  const answersWithAnalysis = await UserAnswer.getSessionAnswersWithAnalysis(
    sessionId
  );
  const interview_data_log = (answersWithAnalysis || []).map((row) => ({
    question_text: row.question_text || "",
    transcription: row.transcription || "",
    sense_voice_analysis: {
      pronunciation_score:
        typeof row.pronunciation_score === "number"
          ? row.pronunciation_score
          : undefined,
      emotion: row.emotion || undefined,
      speed_wpm: typeof row.speed_wpm === "number" ? row.speed_wpm : undefined,
      filler_count:
        typeof row.filler_count === "number" ? row.filler_count : undefined,
      pitch_variation:
        typeof row.pitch_variation === "number"
          ? row.pitch_variation
          : undefined,
    },
  }));

  if (!Array.isArray(interview_data_log) || interview_data_log.length === 0) {
    throw new Error("세션에 입력 데이터가 없습니다.");
  }

  // user_info 구성
  const user = await User.findById(session.user_id);
  const sis = await SelfIntroduction.findByUserId(session.user_id);
  const resumes = await Resume.findByUserId(session.user_id);
  const user_info = {
    name: user?.nickname || session.user_nickname || "지원자",
    self_introduction:
      Array.isArray(sis) && sis.length > 0 ? sis[0]?.content || "" : "",
    resumes:
      Array.isArray(resumes) && resumes.length > 0
        ? resumes[0]?.content || ""
        : "",
  };

  // 통계 및 총점
  const totalQuestions = interview_data_log.length;
  const pronScores = interview_data_log
    .map((i) => i?.sense_voice_analysis?.pronunciation_score)
    .filter((n) => typeof n === "number");
  const avgPron = pronScores.length
    ? pronScores.reduce((a, b) => a + b, 0) / pronScores.length
    : 0.85;
  const avgSpeed =
    interview_data_log
      .map((i) => i?.sense_voice_analysis?.speed_wpm)
      .filter((n) => typeof n === "number")
      .reduce((a, b) => a + b, 0) /
      (interview_data_log.filter(
        (i) => typeof i?.sense_voice_analysis?.speed_wpm === "number"
      ).length || 1) || 0;
  const avgFiller =
    interview_data_log
      .map((i) => i?.sense_voice_analysis?.filler_count)
      .filter((n) => typeof n === "number")
      .reduce((a, b) => a + b, 0) /
      (interview_data_log.filter(
        (i) => typeof i?.sense_voice_analysis?.filler_count === "number"
      ).length || 1) || 0;

  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        avgPron * 100 * 0.6 +
          (100 - Math.min(100, avgFiller * 10)) * 0.2 +
          Math.max(0, 100 - Math.abs(180 - avgSpeed)) * 0.2
      )
    )
  );

  // OpenAI Assistant API로 마크다운 생성
  let markdown = null;
  if (openai && process.env.REPORT) {
    const inputData = { user_info, interview_data_log };
    const prompt = JSON.stringify(inputData);

    try {
      const thread = await openai.beta.threads.create();
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: process.env.REPORT,
      });

      if (run.status === "completed") {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessageForRun = messages.data
          .filter((m) => m.run_id === run.id && m.role === "assistant")
          .pop();
        if (lastMessageForRun) {
          markdown = lastMessageForRun.content?.[0]?.text?.value || null;
        }
      }
    } catch (err) {
      console.error("Assistant API 호출 실패:", err.message);
      throw new Error("리포트 생성에 실패했습니다.");
    }
  } else {
    throw new Error("OpenAI API 설정이 필요합니다.");
  }

  if (!markdown) {
    throw new Error("Assistant에서 리포트를 생성하지 못했습니다.");
  }

  // 저장
  const contentHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(interview_data_log))
    .digest("hex");

  const payloadJson = {
    markdown,
    user_info,
    interview_data_log,
    stats: {
      total_questions: totalQuestions,
      avg_pronunciation: avgPron,
      avg_speed_wpm: avgSpeed,
      avg_filler_count: avgFiller,
      overall_score: overall,
    },
    model: "assistant",
    content_hash: contentHash,
  };

  const existing = await Report.findBySessionId(sessionId);
  let reportId;

  const safeOverall = Number.isFinite(overall) ? overall : 0;
  const savedScore = Math.max(0, Math.min(100, Math.round(safeOverall)));

  const trySave = async (scoreValue) => {
    if (existing) {
      await Report.update(existing.id, {
        total_score: scoreValue,
        strengths: existing.strengths || null,
        weaknesses: existing.weaknesses || null,
        suggestions: existing.suggestions || null,
        report_json: payloadJson,
      });
      return existing.id;
    } else {
      return await Report.create({
        session_id: sessionId,
        total_score: scoreValue,
        strengths: null,
        weaknesses: null,
        suggestions: null,
        report_json: payloadJson,
      });
    }
  };

  if (existing) {
    let existingJson = null;
    try {
      existingJson = existing.report_json
        ? JSON.parse(existing.report_json)
        : null;
    } catch (_) {}
    if (existingJson && existingJson.content_hash === contentHash) {
      return {
        markdown,
        report_id: existing.id,
        session_id: sessionId,
        saved: true,
        deduped: true,
      };
    }
  }

  try {
    reportId = await trySave(savedScore);
  } catch (e1) {
    const normalizedScore = Math.min(0.99, Math.max(0, safeOverall / 100));
    reportId = await trySave(normalizedScore);
  }

  return { markdown, report_id: reportId, session_id: sessionId, saved: true };
}

module.exports = {
  generateFinalMarkdownForSession,
};
