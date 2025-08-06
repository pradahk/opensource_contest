const express = require('express');
const router = express.Router();
const { verifyToken } = require('../config/dbConfig');
const voiceController = require('../controllers/voiceController');

// 음성 분석 결과 생성
router.post('/analysis', verifyToken, voiceController.createVoiceAnalysis);

// 사용자별 음성 분석 통계 조회
router.get('/analysis/user/stats', verifyToken, voiceController.getUserVoiceStats);

// 세션별 음성 분석 통계 조회
router.get('/analysis/session/:sessionId/stats', verifyToken, voiceController.getSessionVoiceStats);

// 세션별 음성 분석 결과 조회
router.get('/analysis/session/:sessionId', verifyToken, voiceController.getVoiceAnalysisBySession);

// 특정 답변의 음성 분석 결과 조회
router.get('/analysis/answer/:answerId', verifyToken, voiceController.getVoiceAnalysisByAnswer);

// 음성 분석 결과 수정
router.put('/analysis/:answerId', verifyToken, voiceController.updateVoiceAnalysis);

// 음성 분석 결과 삭제
router.delete('/analysis/:answerId', verifyToken, voiceController.deleteVoiceAnalysis);

module.exports = router;
