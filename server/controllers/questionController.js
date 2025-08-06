const Question = require('../models/Question');
const Company = require('../models/Company');

// 질문 목록 조회
exports.getQuestions = async (req, res) => {
  try {
    const { company_id, question_type, level, limit = 10 } = req.query;
    const filters = {};
    
    if (company_id) filters.company_id = company_id;
    if (question_type) filters.question_type = question_type;
    if (level) filters.level = level;

    const questions = await Question.getRandomQuestions(parseInt(limit), filters);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('질문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '질문 조회 중 오류가 발생했습니다.'
    });
  }
};

// 특정 질문 조회
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('질문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '질문 조회 중 오류가 발생했습니다.'
    });
  }
};

// 회사별 질문 조회
exports.getQuestionsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const questions = await Question.findByCompany(companyId);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('회사별 질문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '회사별 질문 조회 중 오류가 발생했습니다.'
    });
  }
};

// 질문 생성 (관리자용)
exports.createQuestion = async (req, res) => {
  try {
    const { company_id, job_position, question_text, question_type, level } = req.body;
    
    if (!job_position || !question_text || !question_type || !level) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }
    
    const questionId = await Question.create({
      company_id,
      job_position,
      question_text,
      question_type,
      level
    });
    
    res.status(201).json({
      success: true,
      message: '질문이 성공적으로 생성되었습니다.',
      data: { id: questionId }
    });
  } catch (error) {
    console.error('질문 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '질문 생성 중 오류가 발생했습니다.'
    });
  }
};

// 질문 수정 (관리자용)
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const success = await Question.update(id, updateData);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '질문이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('질문 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '질문 수정 중 오류가 발생했습니다.'
    });
  }
};

// 질문 삭제 (관리자용)
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await Question.delete(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '질문이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('질문 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '질문 삭제 중 오류가 발생했습니다.'
    });
  }
};
