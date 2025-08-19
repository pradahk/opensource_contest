const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const VoiceAnalysis = require("../models/VoiceAnalysis");
const UserAnswer = require("../models/UserAnswer");
const AIInterviewAnswer = require("../models/AIInterviewAnswer");

dotenv.config({ path: ".env" });

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_API || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// AssemblyAI 클라이언트 설정
const assemblyai = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: ASSEMBLYAI_API_KEY,
    "content-type": "application/json",
  },
});

// OpenAI 클라이언트 설정
let openai = null;
if (OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

/**
 * 통합된 음성 분석 서비스
 * 일반 면접과 AI 면접 모두에서 사용 가능
 */
class UnifiedVoiceAnalysisService {
  /**
   * 음성 파일 경로 해석 (통합)
   */
  static resolveAudioPath(audioPath) {
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

    for (const candidate of candidates) {
      try {
        if (candidate && fs.existsSync(candidate)) return candidate;
      } catch (error) {
        console.warn(`경로 확인 실패: ${candidate}`);
      }
    }
    return null;
  }

  /**
   * AssemblyAI를 사용한 음성 분석
   */
  static async analyzeWithAssemblyAI(audioFilePath) {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error("ASSEMBLYAI_API_KEY가 설정되지 않았습니다.");
    }

    console.log(`[AssemblyAI] 분석 시작: ${path.basename(audioFilePath)}`);

    // 파일 업로드
    const fileData = await fs.promises.readFile(audioFilePath);
    const uploadResponse = await assemblyai.post("/upload", fileData, {
      headers: { "content-type": "application/octet-stream" },
    });

    // 전사 요청
    const transcriptResponse = await assemblyai.post("/transcript", {
      audio_url: uploadResponse.data.upload_url,
      sentiment_analysis: true,
      auto_highlights: true,
      speaker_labels: false,
    });

    // 결과 폴링
    const transcriptId = transcriptResponse.data.id;
    console.log(`[AssemblyAI] 작업 ID: ${transcriptId}, 결과 대기 중...`);

    for (let i = 0; i < 60; i++) {
      const pollResponse = await assemblyai.get(`/transcript/${transcriptId}`);
      const status = pollResponse.data.status;

      if (status === "completed") {
        console.log(`[AssemblyAI] 분석 완료: ${transcriptId}`);
        return pollResponse.data;
      } else if (status === "error") {
        throw new Error(`AssemblyAI 분석 실패: ${pollResponse.data.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error("AssemblyAI 분석 타임아웃");
  }

  /**
   * OpenAI를 사용한 음성 분석 (보조)
   */
  static async analyzeWithOpenAI(transcription) {
    if (!openai) {
      return null;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `다음 면접 답변을 분석하여 JSON 형태로 반환하세요:
          {
            "clarity_score": 0-100,
            "content_quality": 0-100, 
            "structure_score": 0-100,
            "keyword_relevance": 0-100,
            "overall_impression": "string"
          }`,
          },
          {
            role: "user",
            content: transcription,
          },
        ],
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.warn("[OpenAI] 분석 실패:", error.message);
      return null;
    }
  }

  /**
   * 통합된 음성 분석 실행
   */
  static async performUnifiedAnalysis(
    answerId,
    audioPath,
    answerType = "user"
  ) {
    const absolutePath = this.resolveAudioPath(audioPath);
    if (!absolutePath) {
      throw new Error(`음성 파일을 찾을 수 없습니다: ${audioPath}`);
    }

    console.log(
      `[통합분석] 시작 - answer_id: ${answerId}, type: ${answerType}`
    );

    // 1. AssemblyAI 분석
    const assemblyResult = await this.analyzeWithAssemblyAI(absolutePath);

    // 2. 기본 메트릭 추출
    const sentimentResult =
      (assemblyResult.sentiment_analysis_results || []).find(
        (r) => r.sentiment !== "NEUTRAL"
      ) || (assemblyResult.sentiment_analysis_results || [])[0];

    const words = Array.isArray(assemblyResult.words)
      ? assemblyResult.words
      : [];
    const fillerCount = words.filter((w) => w.word_type === "filler").length;

    // 3. 답변 텍스트 가져오기 (OpenAI 분석용)
    let transcription = "";
    if (answerType === "ai") {
      const aiAnswer = await AIInterviewAnswer.findById(answerId);
      transcription = aiAnswer?.transcription || "";
    } else {
      const userAnswer = await UserAnswer.findById(answerId);
      transcription = userAnswer?.transcription || "";
    }

    // 4. OpenAI 보조 분석
    const openaiResult = await this.analyzeWithOpenAI(transcription);

    // 5. 통합 분석 결과 생성
    const analysisData = {
      pronunciation_score: assemblyResult.confidence
        ? Number(assemblyResult.confidence.toFixed(2))
        : null,
      emotion: sentimentResult?.sentiment || "NEUTRAL",
      speed_wpm: assemblyResult.words_per_minute || null,
      filler_count: fillerCount,
      pitch_variation: 0.0, // TODO: 실제 음성 분석으로 개선 필요
      confidence_score: assemblyResult.confidence
        ? Number(assemblyResult.confidence.toFixed(2))
        : null,
      raw_analysis_data: {
        assembly_ai: {
          transcript: assemblyResult.text,
          confidence: assemblyResult.confidence,
          words_per_minute: assemblyResult.words_per_minute,
          sentiment_analysis: assemblyResult.sentiment_analysis_results,
          auto_highlights: assemblyResult.auto_highlights,
        },
        openai: openaiResult,
        analysis_timestamp: new Date().toISOString(),
      },
    };

    // 6. 데이터베이스 저장
    const existing = await VoiceAnalysis.findByAnswerId(answerId);
    if (existing) {
      await VoiceAnalysis.update(answerId, {
        ...analysisData,
        analysis_type: "combined",
      });
      console.log(`[통합분석] 업데이트 완료 - answer_id: ${answerId}`);
    } else {
      if (answerType === "ai") {
        await VoiceAnalysis.createForAIAnswer(answerId, analysisData);
      } else {
        await VoiceAnalysis.create({
          answer_id: answerId,
          ...analysisData,
          analysis_type: "combined",
        });
      }
      console.log(`[통합분석] 저장 완료 - answer_id: ${answerId}`);
    }

    return {
      success: true,
      data: {
        answer_id: answerId,
        answer_type: answerType,
        ...analysisData,
      },
    };
  }

  /**
   * 세션의 모든 답변에 대해 통합 분석 실행
   */
  static async analyzeSessionAnswers(sessionId, sessionType = "regular") {
    console.log(
      `[통합분석] 세션 분석 시작 - session_id: ${sessionId}, type: ${sessionType}`
    );

    let answers = [];
    if (sessionType === "ai") {
      answers = await AIInterviewAnswer.findBySessionId(sessionId);
    } else {
      answers = await UserAnswer.findBySessionId(sessionId);
    }

    console.log(`[통합분석] 분석할 답변 수: ${answers.length}`);

    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const answer of answers) {
      try {
        // 이미 분석된 답변인지 확인
        const existing = await VoiceAnalysis.findByAnswerId(answer.id);
        if (existing && existing.analysis_type === "combined") {
          console.log(
            `[통합분석] 스킵 - answer_id: ${answer.id} (이미 분석됨)`
          );
          skipCount++;
          continue;
        }

        if (!answer.audio_path) {
          console.log(
            `[통합분석] 스킵 - answer_id: ${answer.id} (오디오 없음)`
          );
          skipCount++;
          continue;
        }

        const result = await this.performUnifiedAnalysis(
          answer.id,
          answer.audio_path,
          sessionType === "ai" ? "ai" : "user"
        );

        results.push(result);
        successCount++;
      } catch (error) {
        console.error(
          `[통합분석] 실패 - answer_id: ${answer.id}:`,
          error.message
        );
        results.push({
          success: false,
          error: error.message,
          answer_id: answer.id,
        });
        errorCount++;
      }
    }

    console.log(
      `[통합분석] 세션 분석 완료 - 성공: ${successCount}, 스킵: ${skipCount}, 실패: ${errorCount}`
    );

    return {
      session_id: sessionId,
      session_type: sessionType,
      total_answers: answers.length,
      success_count: successCount,
      skip_count: skipCount,
      error_count: errorCount,
      results: results,
    };
  }

  /**
   * 사용자의 모든 음성 분석 통계 (일반 + AI 면접 통합)
   */
  static async getUserUnifiedStats(userId) {
    const [rows] = await pool.query(
      `
      SELECT 
        COUNT(*) as total_analyses,
        AVG(var.pronunciation_score) as avg_pronunciation,
        AVG(var.speed_wpm) as avg_speed,
        AVG(var.filler_count) as avg_filler_count,
        AVG(var.confidence_score) as avg_confidence,
        COUNT(CASE WHEN var.analysis_type = 'assemblyai' THEN 1 END) as legacy_count,
        COUNT(CASE WHEN var.analysis_type = 'combined' THEN 1 END) as unified_count,
        MAX(var.updated_at) as last_analysis_date
      FROM voice_analysis_results var
      LEFT JOIN user_answers ua ON var.answer_id = ua.id
      LEFT JOIN interview_sessions is ON ua.session_id = is.id
      LEFT JOIN ai_interview_answers aia ON var.answer_id = aia.id  
      LEFT JOIN ai_interview_sessions ais ON aia.session_id = ais.id
      WHERE is.user_id = ? OR ais.user_id = ?
    `,
      [userId, userId]
    );

    return rows[0];
  }
}

module.exports = UnifiedVoiceAnalysisService;
