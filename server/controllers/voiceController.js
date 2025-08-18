const VoiceAnalysis = require("../models/VoiceAnalysis");
const UserAnswer = require("../models/UserAnswer");
const InterviewSession = require("../models/InterviewSession");
const voiceAnalysisService = require("../services/voiceAnalysisService");

// 음성 분석 결과 생성
exports.createVoiceAnalysis = async (req, res) => {
  try {
    const {
      answer_id,
      pronunciation_score,
      emotion,
      speed_wpm,
      filler_count,
      pitch_variation,
    } = req.body;

    if (!answer_id || pronunciation_score === undefined) {
      return res.status(400).json({
        success: false,
        message: "답변 ID와 발음 점수는 필수입니다.",
      });
    }

    // 답변 존재 확인
    const answer = await UserAnswer.findById(answer_id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "답변을 찾을 수 없습니다.",
      });
    }

    // 이미 분석 결과가 있는지 확인
    const existingAnalysis = await VoiceAnalysis.findByAnswerId(answer_id);
    if (existingAnalysis) {
      return res.status(409).json({
        success: false,
        message: "이미 해당 답변의 음성 분석 결과가 존재합니다.",
      });
    }

    const analysisId = await VoiceAnalysis.create({
      answer_id,
      pronunciation_score,
      emotion,
      speed_wpm,
      filler_count,
      pitch_variation,
    });

    res.status(201).json({
      success: true,
      message: "음성 분석 결과가 성공적으로 생성되었습니다.",
      data: { id: analysisId },
    });
  } catch (error) {
    console.error("음성 분석 결과 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 결과 생성 중 오류가 발생했습니다.",
    });
  }
};

// 특정 답변의 음성 분석 결과 조회
exports.getVoiceAnalysisByAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const analysis = await VoiceAnalysis.findByAnswerId(answerId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "음성 분석 결과를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("음성 분석 결과 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 결과 조회 중 오류가 발생했습니다.",
    });
  }
};

// 세션별 음성 분석 결과 조회
exports.getVoiceAnalysisBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analyses = await VoiceAnalysis.findBySessionId(sessionId);

    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error("세션별 음성 분석 결과 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 결과 조회 중 오류가 발생했습니다.",
    });
  }
};

// 음성 분석 결과 수정
exports.updateVoiceAnalysis = async (req, res) => {
  try {
    const { answerId } = req.params;
    const updateData = req.body;

    const success = await VoiceAnalysis.update(answerId, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "음성 분석 결과를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "음성 분석 결과가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("음성 분석 결과 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 결과 수정 중 오류가 발생했습니다.",
    });
  }
};

// 음성 분석 결과 삭제
exports.deleteVoiceAnalysis = async (req, res) => {
  try {
    const { answerId } = req.params;

    const success = await VoiceAnalysis.delete(answerId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "음성 분석 결과를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "음성 분석 결과가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("음성 분석 결과 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 결과 삭제 중 오류가 발생했습니다.",
    });
  }
};

// 세션별 음성 분석 통계 조회
exports.getSessionVoiceStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = await VoiceAnalysis.getSessionAnalysis(sessionId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("세션별 음성 분석 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// 사용자별 음성 분석 통계 조회
exports.getUserVoiceStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await VoiceAnalysis.getUserAnalysisStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("사용자별 음성 분석 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// 세션의 모든 답변을 대상으로 AssemblyAI 분석 실행 (수동 트리거)
exports.runSessionAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "sessionId는 필수입니다." });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "세션을 찾을 수 없습니다." });
    }

    console.log(`[VoiceAnalysis] 수동 트리거 - session_id: ${sessionId}`);
    const results = await voiceAnalysisService.analyzeAllAnswersInSession(
      sessionId
    );
    return res.json({ success: true, data: results });
  } catch (error) {
    console.error("세션 분석 실행 오류:", error);
    return res.status(500).json({
      success: false,
      message: "세션 분석 실행 중 오류가 발생했습니다.",
    });
  }
};
