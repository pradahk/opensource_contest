const express = require("express");
const router = express.Router();
const { verifyToken } = require("../config/dbConfig");
const unifiedVoiceController = require("../controllers/unifiedVoiceController");

/**
 * 통합된 음성 분석 라우트
 * 일반 면접과 AI 면접의 음성 분석을 통합 관리
 */

// 통합 음성 분석 실행 (단일 답변)
router.post(
  "/unified-analysis",
  verifyToken,
  unifiedVoiceController.runUnifiedAnalysis
);

// 기존 API 호환성 (레거시 지원)
router.post(
  "/analysis",
  verifyToken,
  unifiedVoiceController.runUnifiedAnalysis
);

// 세션 전체 답변 통합 분석
router.post(
  "/unified-analysis/session/:sessionId",
  verifyToken,
  unifiedVoiceController.runSessionUnifiedAnalysis
);

// 통합된 음성 분석 결과 조회
router.get(
  "/unified-analysis/:answerId",
  verifyToken,
  unifiedVoiceController.getUnifiedAnalysis
);

// 사용자의 통합 음성 분석 통계
router.get(
  "/unified-stats/user",
  verifyToken,
  unifiedVoiceController.getUserUnifiedStats
);

// 분석 타입별 통계
router.get(
  "/unified-stats/analysis-types",
  verifyToken,
  unifiedVoiceController.getAnalysisTypeStats
);

// AI 면접 세션의 음성 분석 결과 조회
router.get(
  "/unified-analysis/ai-session/:sessionId",
  verifyToken,
  unifiedVoiceController.getAISessionVoiceAnalysis
);

// 레거시 데이터 마이그레이션 (관리자용)
router.post(
  "/migrate-legacy",
  verifyToken,
  unifiedVoiceController.migrateLegacyAnalysis
);

module.exports = router;
