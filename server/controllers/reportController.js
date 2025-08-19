const Report = require("../models/Report");
const InterviewSession = require("../models/InterviewSession");
const UserAnswer = require("../models/UserAnswer");
const VoiceAnalysis = require("../models/VoiceAnalysis");
const User = require("../models/User");
const SelfIntroduction = require("../models/SelfIntroduction");
const Resume = require("../models/Resume");
const voiceAnalysisService = require("../services/voiceAnalysisService");
const dotenv = require("dotenv");
const crypto = require("crypto");

let openai = null;
try {
  dotenv.config({ path: ".env" });
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

// 사용자의 모든 보고서 조회
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reports = await Report.findByUserId(userId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 특정 보고서 조회
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    // 사용자 권한 확인
    if (report.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "이 보고서에 접근할 권한이 없습니다.",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 세션별 보고서 조회
exports.getReportBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = await Report.findBySessionId(sessionId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "해당 세션의 보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("세션별 보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 생성
exports.createReport = async (req, res) => {
  try {
    const {
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json,
    } = req.body;

    if (!session_id || total_score === undefined) {
      return res.status(400).json({
        success: false,
        message: "세션 ID와 총점은 필수입니다.",
      });
    }

    // 세션 존재 확인
    const session = await InterviewSession.findById(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "세션을 찾을 수 없습니다.",
      });
    }

    // 이미 보고서가 있는지 확인
    const existingReport = await Report.findBySessionId(session_id);
    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: "이미 해당 세션의 보고서가 존재합니다.",
      });
    }

    const reportId = await Report.create({
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json,
    });

    res.status(201).json({
      success: true,
      message: "보고서가 성공적으로 생성되었습니다.",
      data: { id: reportId },
    });
  } catch (error) {
    console.error("보고서 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 생성 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 수정
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const success = await Report.update(id, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "보고서가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("보고서 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 수정 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 삭제
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await Report.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "보고서가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("보고서 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 삭제 중 오류가 발생했습니다.",
    });
  }
};

// 사용자 통계 조회
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await Report.getStatsByUser(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("사용자 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// AI 면접 최종 마크다운 보고서 생성 (옵션: DB 저장)
exports.generateAIReportMarkdown = async (req, res) => {
  try {
    let {
      user_info,
      interview_data_log,
      session_id: providedSessionId,
    } = req.body || {};

    // 세션 ID가 제공된 경우, DB에서 답변/질문과 음성 분석을 수집하여 interview_data_log를 구성
    if (
      (!Array.isArray(interview_data_log) || interview_data_log.length === 0) &&
      providedSessionId
    ) {
      // 세션 확인
      const session = await InterviewSession.findById(providedSessionId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "세션을 찾을 수 없습니다." });
      }

      // 세션 내 모든 답변에 대해 부족한 음성 분석을 보강
      try {
        await voiceAnalysisService.analyzeAllAnswersInSession(
          providedSessionId
        );
      } catch (e) {
        console.warn("세션 음성 분석 중 경고:", e.message);
      }

      // 분석 포함 답변 재조회 및 interview_data_log 구성
      const answersWithAnalysis =
        await UserAnswer.getSessionAnswersWithAnalysis(providedSessionId);
      interview_data_log = (answersWithAnalysis || []).map((row) => ({
        question_text: row.question_text || "",
        transcription: row.transcription || "",
        sense_voice_analysis: {
          pronunciation_score:
            typeof row.pronunciation_score === "number"
              ? row.pronunciation_score
              : undefined,
          emotion: row.emotion || undefined,
          speed_wpm:
            typeof row.speed_wpm === "number" ? row.speed_wpm : undefined,
          filler_count:
            typeof row.filler_count === "number" ? row.filler_count : undefined,
          pitch_variation:
            typeof row.pitch_variation === "number"
              ? row.pitch_variation
              : undefined,
        },
      }));

      // user_info 자동 구성 (이름/자기소개/이력서)
      if (!user_info) {
        const user = await User.findById(session.user_id);
        const sis = await SelfIntroduction.findByUserId(session.user_id);
        const resumes = await Resume.findByUserId(session.user_id);
        user_info = {
          name: user?.nickname || session.user_nickname || "지원자",
          self_introduction:
            Array.isArray(sis) && sis.length > 0 ? sis[0]?.content || "" : "",
          resumes:
            Array.isArray(resumes) && resumes.length > 0
              ? resumes[0]?.content || ""
              : "",
        };
      }
    }

    if (!Array.isArray(interview_data_log) || interview_data_log.length === 0) {
      return res.status(400).json({
        success: false,
        message: "interview_data_log가 비어 있습니다.",
      });
    }

    // 간단한 통계 계산 (백업용)
    const totalQuestions = interview_data_log.length;
    const pronScores = interview_data_log
      .map((i) => i?.sense_voice_analysis?.pronunciation_score)
      .filter((n) => typeof n === "number");
    const avgPron = pronScores.length
      ? pronScores.reduce((a, b) => a + b, 0) / pronScores.length
      : 0.85; // 데이터는 있으나 점수가 없을 때 기본값
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

    // 총점 산출 (통계용)
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

        if (!markdown) {
          throw new Error("Assistant에서 리포트를 생성하지 못했습니다.");
        }
      } catch (err) {
        console.error("Assistant API 호출 실패:", err.message);
        return res.status(500).json({
          success: false,
          message: "리포트 생성에 실패했습니다.",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "OpenAI API 설정이 필요합니다.",
      });
    }

    // DB 저장 로직 (session_id가 없으면 최소 세션 생성)
    let finalSessionId = providedSessionId;
    try {
      if (!finalSessionId) {
        const newSession = await InterviewSession.create({
          user_id: req.user.userId,
          company_id: null,
        });
        finalSessionId = newSession.id;
      } else {
        const session = await InterviewSession.findById(finalSessionId);
        if (!session) {
          // 존재하지 않으면 새로 생성
          const newSession = await InterviewSession.create({
            user_id: req.user.userId,
            company_id: null,
          });
          finalSessionId = newSession.id;
        }
      }

      // 총점은 이미 위에서 계산됨

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

      const existing = await Report.findBySessionId(finalSessionId);
      let reportId;

      // total_score는 정수 컬럼일 수 있으므로 0~100 범위의 정수로 저장
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
            session_id: finalSessionId,
            total_score: scoreValue,
            strengths: null,
            weaknesses: null,
            suggestions: null,
            report_json: payloadJson,
          });
        }
      };

      if (existing) {
        // 동일 로그로 생성된 보고서면 중복 저장 방지 (idempotent)
        let existingJson = null;
        try {
          existingJson = existing.report_json
            ? JSON.parse(existing.report_json)
            : null;
        } catch (_) {}

        if (existingJson && existingJson.content_hash === contentHash) {
          return res.json({
            success: true,
            data: {
              markdown,
              report_id: existing.id,
              session_id: finalSessionId,
              saved: true,
              deduped: true,
            },
          });
        }
      }

      try {
        reportId = await trySave(savedScore);
      } catch (e1) {
        // total_score 스키마 범위 이슈 대비: 0~0.99 스케일로 재시도
        const normalizedScore = Math.min(0.99, Math.max(0, safeOverall / 100));
        reportId = await trySave(normalizedScore);
      }

      return res.json({
        success: true,
        data: {
          markdown,
          report_id: reportId,
          session_id: finalSessionId,
          saved: true,
        },
      });
    } catch (saveErr) {
      console.warn("보고서 DB 저장 실패, 마크다운만 반환:", saveErr.message);
      return res.json({ success: true, data: { markdown, saved: false } });
    }
  } catch (error) {
    console.error("AI 마크다운 보고서 생성 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "보고서 생성 중 오류가 발생했습니다." });
  }
};
