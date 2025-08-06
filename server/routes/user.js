const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../config/dbConfig");

// 사용자 프로필 관련
router.get("/profile", verifyToken, userController.getUserProfile);

// 관심기업 관련
router.get("/interest-companies", verifyToken, userController.getUserInterestCompanies);
router.post("/interest-companies", verifyToken, userController.addUserInterestCompany);
router.delete("/interest-companies/:companyId", verifyToken, userController.removeUserInterestCompany);

// 자기소개서 관련
router.get("/self-introductions", verifyToken, userController.getSelfIntroductions);
router.post("/self-introductions", verifyToken, userController.createSelfIntroduction);
router.put("/self-introductions/:id", verifyToken, userController.updateSelfIntroduction);
router.delete("/self-introductions/:id", verifyToken, userController.deleteSelfIntroduction);

// 이력서 관련
router.get("/resumes", verifyToken, userController.getResumes);
router.post("/resumes", verifyToken, userController.createResume);
router.put("/resumes/:id", verifyToken, userController.updateResume);
router.delete("/resumes/:id", verifyToken, userController.deleteResume);

// 사용자 통계
router.get("/stats", verifyToken, userController.getUserStats);

module.exports = router;
