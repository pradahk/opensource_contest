const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken, isAdmin } = require("../config/dbConfig");

// 모든 기업 조회 (인증 필요)
router.get("/", verifyToken, companyController.getAllCompanies);

// 특정 기업 조회 (인증 필요)
router.get("/:id", verifyToken, companyController.getCompanyById);

// 기업별 질문 수 조회 (인증 필요)
router.get("/:id/questions", verifyToken, companyController.getCompanyWithQuestions);

// 기업 생성 (관리자만)
router.post("/", verifyToken, isAdmin, companyController.createCompany);

// 기업 수정 (관리자만)
router.put("/:id", verifyToken, isAdmin, companyController.updateCompany);

// 기업 삭제 (관리자만)
router.delete("/:id", verifyToken, isAdmin, companyController.deleteCompany);

module.exports = router; 