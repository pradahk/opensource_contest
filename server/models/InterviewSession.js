const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

class InterviewSession {
  static async create(sessionData) {
    const { user_id, company_id } = sessionData;
    const session_uuid = uuidv4();

    const [result] = await pool.query(
      "INSERT INTO interview_sessions (session_uuid, user_id, company_id) VALUES (?, ?, ?)",
      [session_uuid, user_id, company_id]
    );
    return { id: result.insertId, session_uuid };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT interview_sessions.*, u.nickname as user_nickname, c.name as company_name
      FROM interview_sessions
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE interview_sessions.id = ?
    `,
      [id]
    );
    return rows[0];
  }

  static async findByUuid(sessionUuid) {
    const [rows] = await pool.query(
      `
      SELECT interview_sessions.*, u.nickname as user_nickname, c.name as company_name
      FROM interview_sessions
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE interview_sessions.session_uuid = ?
    `,
      [sessionUuid]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `
      SELECT interview_sessions.*, c.name as company_name
      FROM interview_sessions
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE interview_sessions.user_id = ?
      ORDER BY interview_sessions.started_at DESC
    `,
      [userId]
    );
    return rows;
  }

  static async endSession(sessionId) {
    const [result] = await pool.query(
      "UPDATE interview_sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sessionId]
    );
    return result.affectedRows > 0;
  }

  static async update(sessionId, updateData) {
    const { company_id } = updateData;
    const [result] = await pool.query(
      "UPDATE interview_sessions SET company_id = ? WHERE id = ?",
      [company_id, sessionId]
    );
    return result.affectedRows > 0;
  }

  static async delete(sessionId) {
    const [result] = await pool.query(
      "DELETE FROM interview_sessions WHERE id = ?",
      [sessionId]
    );
    return result.affectedRows > 0;
  }

  static async getActiveSessions(userId) {
    const [rows] = await pool.query(
      `
      SELECT interview_sessions.*, c.name as company_name
      FROM interview_sessions
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE interview_sessions.user_id = ? AND interview_sessions.ended_at IS NULL
      ORDER BY interview_sessions.started_at DESC
    `,
      [userId]
    );
    return rows;
  }

  static async getSessionWithAnswers(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT interview_sessions.*, u.nickname as user_nickname, c.name as company_name,
             ua.id as answer_id, ua.audio_path, ua.transcription, ua.created_at as answer_created_at,
             iq.question_text, iq.question_type, iq.level
      FROM interview_sessions
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      LEFT JOIN user_answers ua ON interview_sessions.id = ua.session_id
      LEFT JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE interview_sessions.id = ?
      ORDER BY ua.created_at
    `,
      [sessionId]
    );
    return rows;
  }
}

module.exports = InterviewSession;
