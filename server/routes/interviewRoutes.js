const express = require("express");
const router = express.Router();
const { verifyToken } = require("../config/dbConfig");
const InterviewSession = require("../models/InterviewSession");
const UserAnswer = require("../models/UserAnswer");
const Question = require("../models/Question");
const reportService = require("../services/reportService");

// 면접 세션 생성
router.post("/sessions", verifyToken, async (req, res) => {
  try {
    const { company_id } = req.body;
    const userId = req.user.userId;

    // company_id가 없거나 0인 경우 null로 설정
    const sessionCompanyId = company_id && company_id !== 0 ? company_id : null;

    const sessionData = await InterviewSession.create({
      user_id: userId,
      company_id: sessionCompanyId,
    });

    res.status(201).json({
      success: true,
      message: "면접 세션이 성공적으로 생성되었습니다.",
      data: sessionData,
    });
  } catch (error) {
    console.error("면접 세션 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "면접 세션 생성 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 사용자의 면접 세션 목록 조회
router.get("/sessions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await InterviewSession.findByUserId(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("면접 세션 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "면접 세션 조회 중 오류가 발생했습니다.",
    });
  }
});

// 특정 면접 세션 조회
router.get("/sessions/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "면접 세션을 찾을 수 없습니다.",
      });
    }

    // 사용자 권한 확인
    if (session.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "이 세션에 접근할 권한이 없습니다.",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("면접 세션 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "면접 세션 조회 중 오류가 발생했습니다.",
    });
  }
});

// 면접 세션 종료
router.put("/sessions/:sessionId/end", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // sessionId가 session_uuid인 경우 실제 session_id로 변환
    let actualSessionId = sessionId;
    if (typeof sessionId === "string" && sessionId.length > 20) {
      const session = await InterviewSession.findByUuid(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "면접 세션을 찾을 수 없습니다.",
        });
      }
      actualSessionId = session.id;
    }

    const success = await InterviewSession.endSession(actualSessionId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "면접 세션을 찾을 수 없습니다.",
      });
    }

    // 세션 종료 후: 음성 분석 실행 + 최종 보고서 자동 생성/저장
    let report = null;
    try {
      report = await reportService.generateFinalMarkdownForSession(
        actualSessionId,
        req.user.userId
      );
    } catch (e) {
      console.warn("세션 종료 후 보고서 자동 생성 실패:", e.message);
    }

    res.json({
      success: true,
      message: "면접 세션이 성공적으로 종료되었습니다.",
      report: report || null,
    });
  } catch (error) {
    console.error("면접 세션 종료 오류:", error);
    res.status(500).json({
      success: false,
      message: "면접 세션 종료 중 오류가 발생했습니다.",
    });
  }
});

// 사용자 답변 생성
router.post("/answers", verifyToken, async (req, res) => {
  try {
    const { session_id, question_id, audio_path, transcription } = req.body;

    if (!session_id || !question_id) {
      return res.status(400).json({
        success: false,
        message: "세션 ID와 질문 ID는 필수입니다.",
      });
    }

    // session_id가 session_uuid인 경우 실제 session_id로 변환
    let actualSessionId = session_id;
    if (typeof session_id === "string" && session_id.length > 20) {
      // session_uuid로 세션을 찾아서 실제 session_id 가져오기
      const session = await InterviewSession.findByUuid(session_id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "세션을 찾을 수 없습니다.",
        });
      }
      actualSessionId = session.id;
    }

    const answerId = await UserAnswer.create({
      session_id: actualSessionId,
      question_id,
      audio_path,
      transcription,
    });

    res.status(201).json({
      success: true,
      message: "답변이 성공적으로 저장되었습니다.",
      data: { id: answerId },
    });
  } catch (error) {
    console.error("답변 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "답변 생성 중 오류가 발생했습니다.",
    });
  }
});

// 세션별 답변 목록 조회
router.get("/sessions/:sessionId/answers", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const answers = await UserAnswer.findBySessionId(sessionId);

    res.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    console.error("답변 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "답변 조회 중 오류가 발생했습니다.",
    });
  }
});

// 질문 목록 조회 (면접용)
router.get("/questions", verifyToken, async (req, res) => {
  try {
    const { company_id, question_type, level, limit = 10 } = req.query;
    const filters = {};

    if (company_id) filters.company_id = company_id;
    if (question_type) filters.question_type = question_type;
    if (level) filters.level = level;

    const questions = await Question.getRandomQuestions(
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("질문 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "질문 조회 중 오류가 발생했습니다.",
    });
  }
});

// 세션별 답변과 분석 결과 조회
router.get(
  "/sessions/:sessionId/answers-with-analysis",
  verifyToken,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const answers = await UserAnswer.getSessionAnswersWithAnalysis(sessionId);

      res.json({
        success: true,
        data: answers,
      });
    } catch (error) {
      console.error("답변 및 분석 결과 조회 오류:", error);
      res.status(500).json({
        success: false,
        message: "답변 및 분석 결과 조회 중 오류가 발생했습니다.",
      });
    }
  }
);

module.exports = router;
