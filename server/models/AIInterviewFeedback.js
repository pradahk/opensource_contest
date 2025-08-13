const pool = require("../config/db");

class AIInterviewFeedback {
  // 피드백 생성
  static async create(feedbackData) {
    const connection = await pool.getConnection();
    try {
      const {
        session_id,
        overall_score,
        communication_score,
        technical_score,
        personality_score,
        strengths,
        weaknesses,
        improvement_suggestions,
        detailed_feedback,
      } = feedbackData;

      const [result] = await connection.query(
        `INSERT INTO ai_interview_feedback 
         (session_id, overall_score, communication_score, technical_score, personality_score, 
          strengths, weaknesses, improvement_suggestions, detailed_feedback) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          overall_score,
          communication_score,
          technical_score,
          personality_score,
          strengths,
          weaknesses,
          improvement_suggestions,
          detailed_feedback ? JSON.stringify(detailed_feedback) : null,
        ]
      );

      return {
        id: result.insertId,
        session_id,
        overall_score,
        communication_score,
        technical_score,
        personality_score,
        strengths,
        weaknesses,
        improvement_suggestions,
        detailed_feedback,
        created_at: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  // 세션별 피드백 조회
  static async findBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_feedback WHERE session_id = ?`,
        [sessionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // ID로 피드백 조회
  static async findById(feedbackId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM ai_interview_feedback WHERE id = ?`,
        [feedbackId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 사용자별 피드백 목록 조회
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aif.*, ais.session_uuid, c.name as company_name
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         LEFT JOIN companies c ON ais.company_id = c.id
         WHERE ais.user_id = ?
         ORDER BY aif.created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 피드백 업데이트
  static async update(feedbackId, updateData) {
    const connection = await pool.getConnection();
    try {
      const {
        overall_score,
        communication_score,
        technical_score,
        personality_score,
        strengths,
        weaknesses,
        improvement_suggestions,
        detailed_feedback,
      } = updateData;

      const [result] = await connection.query(
        `UPDATE ai_interview_feedback 
         SET overall_score = ?, communication_score = ?, technical_score = ?, 
             personality_score = ?, strengths = ?, weaknesses = ?, 
             improvement_suggestions = ?, detailed_feedback = ? 
         WHERE id = ?`,
        [
          overall_score,
          communication_score,
          technical_score,
          personality_score,
          strengths,
          weaknesses,
          improvement_suggestions,
          detailed_feedback ? JSON.stringify(detailed_feedback) : null,
          feedbackId,
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 피드백 삭제
  static async delete(feedbackId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_feedback WHERE id = ?`,
        [feedbackId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 세션별 피드백 삭제
  static async deleteBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM ai_interview_feedback WHERE session_id = ?`,
        [sessionId]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 피드백과 세션 정보를 함께 조회
  static async getFeedbackWithSession(feedbackId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aif.*, ais.session_uuid, ais.started_at, ais.ended_at, 
                c.name as company_name, u.nickname as user_name
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         LEFT JOIN companies c ON ais.company_id = c.id
         LEFT JOIN users u ON ais.user_id = u.id
         WHERE aif.id = ?`,
        [feedbackId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 사용자의 평균 점수 통계 조회
  static async getUserScoreStats(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
           AVG(aif.overall_score) as avg_overall_score,
           AVG(aif.communication_score) as avg_communication_score,
           AVG(aif.technical_score) as avg_technical_score,
           AVG(aif.personality_score) as avg_personality_score,
           COUNT(*) as total_feedback_count,
           MAX(aif.created_at) as latest_feedback_date
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         WHERE ais.user_id = ?`,
        [userId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 점수별 피드백 분포 조회
  static async getScoreDistribution(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
           CASE 
             WHEN overall_score >= 90 THEN 'A+ (90-100)'
             WHEN overall_score >= 80 THEN 'A (80-89)'
             WHEN overall_score >= 70 THEN 'B (70-79)'
             WHEN overall_score >= 60 THEN 'C (60-69)'
             ELSE 'D (0-59)'
           END as score_range,
           COUNT(*) as count
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         WHERE ais.user_id = ?
         GROUP BY score_range
         ORDER BY MIN(overall_score) DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 최근 피드백 조회 (최근 N개)
  static async getRecentFeedback(userId, limit = 5) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT aif.*, ais.session_uuid, c.name as company_name
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         LEFT JOIN companies c ON ais.company_id = c.id
         WHERE ais.user_id = ?
         ORDER BY aif.created_at DESC
         LIMIT ?`,
        [userId, limit]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 점수 개선 추이 조회
  static async getScoreTrend(userId, days = 30) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
           DATE(aif.created_at) as feedback_date,
           AVG(aif.overall_score) as avg_overall_score,
           AVG(aif.communication_score) as avg_communication_score,
           AVG(aif.technical_score) as avg_technical_score,
           AVG(aif.personality_score) as avg_personality_score,
           COUNT(*) as feedback_count
         FROM ai_interview_feedback aif
         JOIN ai_interview_sessions ais ON aif.session_id = ais.id
         WHERE ais.user_id = ? 
           AND aif.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(aif.created_at)
         ORDER BY feedback_date`,
        [userId, days]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = AIInterviewFeedback;
