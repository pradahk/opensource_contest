const express = require('express');
const router = express.Router();
const { verifyToken } = require('../config/dbConfig');
const questionController = require('../controllers/questionController');

// 질문 목록 조회
router.get('/', questionController.getQuestions);

// 회사별 질문 조회
router.get('/company/:companyId', questionController.getQuestionsByCompany);

// 특정 질문 조회
router.get('/:id', questionController.getQuestionById);

// 질문 생성 (관리자용)
router.post('/', verifyToken, questionController.createQuestion);

// 질문 수정 (관리자용)
router.put('/:id', verifyToken, questionController.updateQuestion);

// 질문 삭제 (관리자용)
router.delete('/:id', verifyToken, questionController.deleteQuestion);

module.exports = router; 