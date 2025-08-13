const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

class AIInterviewSession {
  // AI 면접 세션 생성
  static async create(sessionData) {
    const connection = await pool.getConnection();
    try {
      const sessionUuid = uuidv4();
      const { user_id, company_id, self_introduction_id, resume_id } =
        sessionData;

      const [result] = await connection.query(
        `INSERT INTO ai_interview_sessions 
         (session_uuid, user_id, company_id, self_introduction_id, resume_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [sessionUuid, user_id, company_id, self_introduction_id, resume_id]
      );

      return {
        id: result.insertId,
        session_uuid: sessionUuid,
        user_id,
        company_id,
        self_introduction_id,
        resume_id,
        current_question_number: 1,
        total_questions: 0,
        status: "active",
        started_at: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  // UUID로 세션 조회
  static async findByUuid(sessionUuid) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_sessions WHERE session_uuid = ?`,
        [sessionUuid]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // ID로 세션 조회
  static async findById(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_sessions WHERE id = ?`,
        [sessionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 사용자별 세션 목록 조회
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT ais.*, c.name as company_name 
         FROM ai_interview_sessions ais 
         LEFT JOIN companies c ON ais.company_id = c.id 
         WHERE ais.user_id = ? 
         ORDER BY ais.started_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 세션 상태 업데이트
  static async updateStatus(sessionId, status, additionalData = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `UPDATE ai_interview_sessions SET status = ?`;
      let params = [status];

      if (status === "completed") {
        query += `, ended_at = NOW()`;
      }

      if (additionalData.current_question_number !== undefined) {
        query += `, current_question_number = ?`;
        params.push(additionalData.current_question_number);
      }

      if (additionalData.total_questions !== undefined) {
        query += `, total_questions = ?`;
        params.push(additionalData.total_questions);
      }

      if (additionalData.thread_id !== undefined) {
        query += `, thread_id = ?`;
        params.push(additionalData.thread_id);
      }

      query += ` WHERE id = ?`;
      params.push(sessionId);

      const [result] = await connection.query(query, params);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 세션 종료
  static async endSession(sessionId) {
    return await this.updateStatus(sessionId, "completed");
  }

  // 세션 일시정지
  static async pauseSession(sessionId) {
    return await this.updateStatus(sessionId, "paused");
  }

  // 세션 재개
  static async resumeSession(sessionId) {
    return await this.updateStatus(sessionId, "active");
  }

  // 세션 삭제
  static async delete(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_sessions WHERE id = ?`,
        [sessionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 세션과 관련된 모든 데이터 조회 (질문, 답변 포함)
  static async getSessionWithDetails(sessionId) {
    const connection = await pool.getConnection();
    try {
      // 세션 정보 조회
      const [sessionRows] = await connection.query(
        `SELECT ais.*, c.name as company_name, si.content as self_introduction, r.content as resume
         FROM ai_interview_sessions ais 
         LEFT JOIN companies c ON ais.company_id = c.id
         LEFT JOIN self_introductions si ON ais.self_introduction_id = si.id
         LEFT JOIN resumes r ON ais.resume_id = r.id
         WHERE ais.id = ?`,
        [sessionId]
      );

      if (sessionRows.length === 0) {
        return null;
      }

      const session = sessionRows[0];

      // 질문 목록 조회
      const [questionRows] = await connection.query(
        `SELECT * FROM ai_interview_questions 
         WHERE session_id = ? 
         ORDER BY question_number, created_at`,
        [sessionId]
      );

      // 답변 목록 조회
      const [answerRows] = await connection.query(
        `SELECT aia.*, aiq.question_text, aiq.question_type
         FROM ai_interview_answers aia
         JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
         WHERE aia.session_id = ?
         ORDER BY aia.created_at`,
        [sessionId]
      );

      // 피드백 조회
      const [feedbackRows] = await connection.query(
        `SELECT * FROM ai_interview_feedback WHERE session_id = ?`,
        [sessionId]
      );

      return {
        ...session,
        questions: questionRows,
        answers: answerRows,
        feedback: feedbackRows[0] || null,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = AIInterviewSession;
