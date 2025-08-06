const pool = require("../config/db");

class Report {
  static async create(reportData) {
    const {
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json,
    } = reportData;
    const [result] = await pool.query(
      "INSERT INTO feedback_reports (session_id, total_score, strengths, weaknesses, suggestions, report_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        session_id,
        total_score,
        strengths,
        weaknesses,
        suggestions,
        JSON.stringify(report_json),
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT fr.*, interview_sessions.session_uuid, u.nickname as user_nickname, c.name as company_name
      FROM feedback_reports fr
      JOIN interview_sessions ON fr.session_id = interview_sessions.id
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE fr.id = ?
    `,
      [id]
    );
    return rows[0];
  }

  static async findBySessionId(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT fr.*, interview_sessions.session_uuid, u.nickname as user_nickname, c.name as company_name
      FROM feedback_reports fr
      JOIN interview_sessions ON fr.session_id = interview_sessions.id
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE fr.session_id = ?
    `,
      [sessionId]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `
      SELECT fr.*, interview_sessions.session_uuid, c.name as company_name
      FROM feedback_reports fr
      JOIN interview_sessions ON fr.session_id = interview_sessions.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      WHERE interview_sessions.user_id = ?
      ORDER BY fr.created_at DESC
    `,
      [userId]
    );
    return rows;
  }

  static async update(id, updateData) {
    const { total_score, strengths, weaknesses, suggestions, report_json } =
      updateData;
    const [result] = await pool.query(
      "UPDATE feedback_reports SET total_score = ?, strengths = ?, weaknesses = ?, suggestions = ?, report_json = ? WHERE id = ?",
      [
        total_score,
        strengths,
        weaknesses,
        suggestions,
        JSON.stringify(report_json),
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM feedback_reports WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.query(`
      SELECT fr.*, interview_sessions.session_uuid, u.nickname as user_nickname, c.name as company_name
      FROM feedback_reports fr
      JOIN interview_sessions ON fr.session_id = interview_sessions.id
      JOIN users u ON interview_sessions.user_id = u.id
      LEFT JOIN companies c ON interview_sessions.company_id = c.id
      ORDER BY fr.created_at DESC
    `);
    return rows;
  }

  static async getStatsByUser(userId) {
    const [rows] = await pool.query(
      `
      SELECT 
        COUNT(*) as total_reports,
        AVG(total_score) as average_score,
        MAX(total_score) as best_score,
        MIN(total_score) as worst_score
      FROM feedback_reports fr
      JOIN interview_sessions ON fr.session_id = interview_sessions.id
      WHERE interview_sessions.user_id = ?
    `,
      [userId]
    );
    return rows[0];
  }
}

module.exports = Report;
