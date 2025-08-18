const express = require("express");
const router = express.Router();
const { verifyToken } = require("../config/dbConfig");
const reportController = require("../controllers/reportController");

// 사용자 통계 조회
router.get("/user/stats", verifyToken, reportController.getUserStats);

// 사용자의 모든 보고서 조회
router.get("/user", verifyToken, reportController.getUserReports);

// 세션별 보고서 조회
router.get(
  "/session/:sessionId",
  verifyToken,
  reportController.getReportBySession
);

// 특정 보고서 조회
router.get("/:id", verifyToken, reportController.getReportById);

// 보고서 생성
router.post("/", verifyToken, reportController.createReport);

// AI 면접 최종 마크다운 보고서 생성 (저장 없이 즉시 생성)
router.post(
  "/generate/markdown",
  verifyToken,
  reportController.generateAIReportMarkdown
);

// 보고서 수정
router.put("/:id", verifyToken, reportController.updateReport);

// 보고서 삭제
router.delete("/:id", verifyToken, reportController.deleteReport);

module.exports = router;
