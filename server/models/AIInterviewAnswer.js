const pool = require("../config/db");

class AIInterviewAnswer {
  // 답변 생성
  static async create(answerData) {
    const connection = await pool.getConnection();
    try {
      const {
        session_id,
        question_id,
        audio_path,
        transcription,
        ai_analysis,
      } = answerData;

      const [result] = await connection.query(
        `INSERT INTO ai_interview_answers 
         (session_id, question_id, audio_path, transcription, ai_analysis) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          session_id,
          question_id,
          audio_path,
          transcription,
          ai_analysis ? JSON.stringify(ai_analysis) : null,
        ]
      );

      return {
        id: result.insertId,
        session_id,
        question_id,
        audio_path,
        transcription,
        ai_analysis,
        created_at: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  // 세션별 답변 목록 조회
  static async findBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aia.*, aiq.question_text, aiq.question_type, aiq.question_number
         FROM ai_interview_answers aia
         JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
         WHERE aia.session_id = ?
         ORDER BY aia.created_at`,
        [sessionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 질문별 답변 조회
  static async findByQuestionId(questionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_answers WHERE question_id = ?`,
        [questionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // ID로 답변 조회
  static async findById(answerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aia.*, aiq.question_text, aiq.question_type
         FROM ai_interview_answers aia
         JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
         WHERE aia.id = ?`,
        [answerId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 답변 업데이트
  static async update(answerId, updateData) {
    const connection = await pool.getConnection();
    try {
      const { audio_path, transcription, ai_analysis } = updateData;
      const [result] = await connection.query(
        `UPDATE ai_interview_answers 
         SET audio_path = ?, transcription = ?, ai_analysis = ? 
         WHERE id = ?`,
        [
          audio_path,
          transcription,
          ai_analysis ? JSON.stringify(ai_analysis) : null,
          answerId,
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 답변 삭제
  static async delete(answerId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_answers WHERE id = ?`,
        [answerId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 세션의 모든 답변 삭제
  static async deleteBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_answers WHERE session_id = ?`,
        [sessionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 질문의 답변 삭제
  static async deleteByQuestionId(questionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_answers WHERE question_id = ?`,
        [questionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 답변과 질문을 함께 조회 (상세 정보)
  static async getAnswerWithQuestion(answerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aia.*, aiq.question_text, aiq.question_type, aiq.question_number, aiq.is_follow_up
         FROM ai_interview_answers aia
         JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
         WHERE aia.id = ?`,
        [answerId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 세션의 답변 통계 조회
  static async getSessionAnswerStats(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
           COUNT(*) as total_answers,
           AVG(LENGTH(transcription)) as avg_answer_length,
           MIN(created_at) as first_answer_time,
           MAX(created_at) as last_answer_time
         FROM ai_interview_answers 
         WHERE session_id = ?`,
        [sessionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 답변 품질 분석 결과 저장
  static async updateAIAnalysis(answerId, analysisData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE ai_interview_answers 
         SET ai_analysis = ? 
         WHERE id = ?`,
        [JSON.stringify(analysisData), answerId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // AI 분석 결과가 있는 답변 조회
  static async getAnswersWithAnalysis(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aia.*, aiq.question_text, aiq.question_type
         FROM ai_interview_answers aia
         JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
         WHERE aia.session_id = ? AND aia.ai_analysis IS NOT NULL
         ORDER BY aia.created_at`,
        [sessionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = AIInterviewAnswer;
