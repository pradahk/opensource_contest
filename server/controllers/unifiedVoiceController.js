const VoiceAnalysis = require("../models/VoiceAnalysis");
const UserAnswer = require("../models/UserAnswer");
const AIInterviewAnswer = require("../models/AIInterviewAnswer");
const UnifiedVoiceAnalysisService = require("../services/unifiedVoiceAnalysisService");
const pool = require("../config/db");

/**
 * 통합된 음성 분석 컨트롤러
 * 일반 면접과 AI 면접의 음성 분석을 통합 관리
 */

// 통합 음성 분석 실행
const runUnifiedAnalysis = async (req, res) => {
  try {
    const { answerId, answerType = "user" } = req.body;

    if (!answerId) {
      return res.status(400).json({
        success: false,
        message: "답변 ID는 필수입니다.",
      });
    }

    // 답변 존재 확인
    let answer = null;
    if (answerType === "ai") {
      answer = await AIInterviewAnswer.findById(answerId);
    } else {
      answer = await UserAnswer.findById(answerId);
    }

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "답변을 찾을 수 없습니다.",
      });
    }

    if (!answer.audio_path) {
      return res.status(400).json({
        success: false,
        message: "음성 파일이 없습니다.",
      });
    }

    const result = await UnifiedVoiceAnalysisService.performUnifiedAnalysis(
      answerId,
      answer.audio_path,
      answerType
    );

    res.json({
      success: true,
      message: "통합 음성 분석이 완료되었습니다.",
      data: result.data,
    });
  } catch (error) {
    console.error("통합 음성 분석 오류:", error);
    res.status(500).json({
      success: false,
      message: "음성 분석 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 세션 전체 답변 통합 분석
const runSessionUnifiedAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionType = "regular" } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "세션 ID는 필수입니다.",
      });
    }

    const result = await UnifiedVoiceAnalysisService.analyzeSessionAnswers(
      sessionId,
      sessionType
    );

    res.json({
      success: true,
      message: "세션 통합 음성 분석이 완료되었습니다.",
      data: result,
    });
  } catch (error) {
    console.error("세션 통합 분석 오류:", error);
    res.status(500).json({
      success: false,
      message: "세션 분석 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 통합된 음성 분석 결과 조회
const getUnifiedAnalysis = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { answerType = "user" } = req.query;

    const analysis = await VoiceAnalysis.getUnifiedAnalysis(
      answerId,
      answerType
    );

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
    console.error("통합 분석 결과 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "분석 결과 조회 중 오류가 발생했습니다.",
    });
  }
};

// 사용자의 통합 음성 분석 통계
const getUserUnifiedStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await UnifiedVoiceAnalysisService.getUserUnifiedStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("사용자 통합 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// 분석 타입별 통계
const getAnalysisTypeStats = async (req, res) => {
  try {
    const stats = await VoiceAnalysis.getAnalysisTypeStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("분석 타입별 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// AI 면접 세션의 음성 분석 결과 조회
const getAISessionVoiceAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analyses = await VoiceAnalysis.findByAISessionId(sessionId);

    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error("AI 세션 음성 분석 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "AI 세션 분석 결과 조회 중 오류가 발생했습니다.",
    });
  }
};

// 레거시 분석 결과를 통합 시스템으로 마이그레이션
const migrateLegacyAnalysis = async (req, res) => {
  try {
    console.log("[마이그레이션] 레거시 음성 분석 데이터 마이그레이션 시작");

    // analysis_type이 null이거나 'assemblyai'인 기존 데이터 찾기
    const [legacyRows] = await pool.query(`
      SELECT * FROM voice_analysis_results 
      WHERE analysis_type IS NULL OR analysis_type = 'assemblyai'
    `);

    let migratedCount = 0;
    let errorCount = 0;

    for (const row of legacyRows) {
      try {
        // raw_analysis_data가 없는 경우 기본 구조 생성
        if (!row.raw_analysis_data) {
          const rawData = {
            legacy_data: {
              pronunciation_score: row.pronunciation_score,
              emotion: row.emotion,
              speed_wpm: row.speed_wpm,
              filler_count: row.filler_count,
              pitch_variation: row.pitch_variation || 0.0,
            },
            migration_timestamp: new Date().toISOString(),
            migrated_from: "legacy_assemblyai",
          };

          await VoiceAnalysis.update(row.answer_id, {
            analysis_type: "assemblyai",
            raw_analysis_data: rawData,
            confidence_score: row.pronunciation_score, // 기존 발음 점수를 신뢰도로 사용
          });

          migratedCount++;
        }
      } catch (error) {
        console.error(
          `마이그레이션 실패 - answer_id: ${row.answer_id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(
      `[마이그레이션] 완료 - 성공: ${migratedCount}, 실패: ${errorCount}`
    );

    res.json({
      success: true,
      message: "레거시 데이터 마이그레이션이 완료되었습니다.",
      data: {
        migrated_count: migratedCount,
        error_count: errorCount,
        total_legacy_records: legacyRows.length,
      },
    });
  } catch (error) {
    console.error("마이그레이션 오류:", error);
    res.status(500).json({
      success: false,
      message: "마이그레이션 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

module.exports = {
  runUnifiedAnalysis,
  runSessionUnifiedAnalysis,
  getUnifiedAnalysis,
  getUserUnifiedStats,
  getAnalysisTypeStats,
  getAISessionVoiceAnalysis,
  migrateLegacyAnalysis,
};
