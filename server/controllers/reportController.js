const Report = require('../models/Report');
const InterviewSession = require('../models/InterviewSession');
const UserAnswer = require('../models/UserAnswer');
const VoiceAnalysis = require('../models/VoiceAnalysis');

// 사용자의 모든 보고서 조회
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reports = await Report.findByUserId(userId);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('보고서 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 조회 중 오류가 발생했습니다.'
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
        message: '보고서를 찾을 수 없습니다.'
      });
    }
    
    // 사용자 권한 확인
    if (report.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '이 보고서에 접근할 권한이 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('보고서 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 조회 중 오류가 발생했습니다.'
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
        message: '해당 세션의 보고서를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('세션별 보고서 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 조회 중 오류가 발생했습니다.'
    });
  }
};

// 보고서 생성
exports.createReport = async (req, res) => {
  try {
    const { session_id, total_score, strengths, weaknesses, suggestions, report_json } = req.body;
    
    if (!session_id || total_score === undefined) {
      return res.status(400).json({
        success: false,
        message: '세션 ID와 총점은 필수입니다.'
      });
    }
    
    // 세션 존재 확인
    const session = await InterviewSession.findById(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '세션을 찾을 수 없습니다.'
      });
    }
    
    // 이미 보고서가 있는지 확인
    const existingReport = await Report.findBySessionId(session_id);
    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: '이미 해당 세션의 보고서가 존재합니다.'
      });
    }
    
    const reportId = await Report.create({
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json
    });
    
    res.status(201).json({
      success: true,
      message: '보고서가 성공적으로 생성되었습니다.',
      data: { id: reportId }
    });
  } catch (error) {
    console.error('보고서 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 생성 중 오류가 발생했습니다.'
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
        message: '보고서를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '보고서가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('보고서 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 수정 중 오류가 발생했습니다.'
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
        message: '보고서를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '보고서가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('보고서 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 삭제 중 오류가 발생했습니다.'
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
      data: stats
    });
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다.'
    });
  }
};
