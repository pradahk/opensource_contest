const pool = require("../config/db");

class AIInterviewQuestion {
  // 질문 생성
  static async create(questionData) {
    const connection = await pool.getConnection();
    try {
      const {
        session_id,
        question_number,
        question_text,
        question_type,
        is_follow_up,
        parent_question_id,
      } = questionData;

      const [result] = await connection.query(
        `INSERT INTO ai_interview_questions 
         (session_id, question_number, question_text, question_type, is_follow_up, parent_question_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          question_number,
          question_text,
          question_type,
          is_follow_up,
          parent_question_id,
        ]
      );

      return {
        id: result.insertId,
        session_id,
        question_number,
        question_text,
        question_type,
        is_follow_up,
        parent_question_id,
        created_at: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  // 세션별 질문 목록 조회
  static async findBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_questions 
         WHERE session_id = ? 
         ORDER BY question_number, created_at`,
        [sessionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // ID로 질문 조회
  static async findById(questionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_questions WHERE id = ?`,
        [questionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 세션의 현재 질문 조회
  static async getCurrentQuestion(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_questions 
         WHERE session_id = ? 
         ORDER BY question_number DESC, created_at DESC 
         LIMIT 1`,
        [sessionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 세션의 기본 질문 수 조회 (꼬리 질문 제외)
  static async getBasicQuestionCount(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM ai_interview_questions 
         WHERE session_id = ? AND is_follow_up = FALSE`,
        [sessionId]
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }

  // 세션의 꼬리 질문 수 조회
  static async getFollowUpQuestionCount(sessionId, parentQuestionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM ai_interview_questions 
         WHERE session_id = ? AND parent_question_id = ? AND is_follow_up = TRUE`,
        [sessionId, parentQuestionId]
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }

  // 질문 업데이트
  static async update(questionId, updateData) {
    const connection = await pool.getConnection();
    try {
      const { question_text, question_type } = updateData;
      const [result] = await connection.query(
        `UPDATE ai_interview_questions 
         SET question_text = ?, question_type = ? 
         WHERE id = ?`,
        [question_text, question_type, questionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 질문 삭제
  static async delete(questionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_questions WHERE id = ?`,
        [questionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 세션의 모든 질문 삭제
  static async deleteBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_questions WHERE session_id = ?`,
        [sessionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 질문과 답변을 함께 조회
  static async getQuestionWithAnswer(questionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aiq.*, aia.transcription, aia.audio_path, aia.ai_analysis
         FROM ai_interview_questions aiq
         LEFT JOIN ai_interview_answers aia ON aiq.id = aia.question_id
         WHERE aiq.id = ?`,
        [questionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 세션의 질문 통계 조회
  static async getSessionQuestionStats(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
           COUNT(*) as total_questions,
           SUM(CASE WHEN is_follow_up = FALSE THEN 1 ELSE 0 END) as basic_questions,
           SUM(CASE WHEN is_follow_up = TRUE THEN 1 ELSE 0 END) as follow_up_questions,
           question_type,
           COUNT(*) as type_count
         FROM ai_interview_questions 
         WHERE session_id = ? 
         GROUP BY question_type`,
        [sessionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = AIInterviewQuestion;
