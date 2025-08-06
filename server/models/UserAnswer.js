const pool = require("../config/db");

class UserAnswer {
  static async create(answerData) {
    const { session_id, question_id, audio_path, transcription } = answerData;
    const [result] = await pool.query(
      "INSERT INTO user_answers (session_id, question_id, audio_path, transcription) VALUES (?, ?, ?, ?)",
      [session_id, question_id, audio_path, transcription]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT ua.*, iq.question_text, iq.question_type, iq.level,
             is.session_uuid, u.nickname as user_nickname
      FROM user_answers ua
      JOIN interview_questions iq ON ua.question_id = iq.id
      JOIN interview_sessions is ON ua.session_id = is.id
      JOIN users u ON is.user_id = u.id
      WHERE ua.id = ?
    `,
      [id]
    );
    return rows[0];
  }

  static async findBySessionId(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT ua.*, iq.question_text, iq.question_type, iq.level
      FROM user_answers ua
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE ua.session_id = ?
      ORDER BY ua.created_at
    `,
      [sessionId]
    );
    return rows;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `
      SELECT ua.*, iq.question_text, iq.question_type, iq.level,
             is.session_uuid, c.name as company_name
      FROM user_answers ua
      JOIN interview_questions iq ON ua.question_id = iq.id
      JOIN interview_sessions is ON ua.session_id = is.id
      LEFT JOIN companies c ON is.company_id = c.id
      WHERE is.user_id = ?
      ORDER BY ua.created_at DESC
    `,
      [userId]
    );
    return rows;
  }

  static async update(id, updateData) {
    const { audio_path, transcription } = updateData;
    const [result] = await pool.query(
      "UPDATE user_answers SET audio_path = ?, transcription = ? WHERE id = ?",
      [audio_path, transcription, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query("DELETE FROM user_answers WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async getAnswerWithAnalysis(answerId) {
    const [rows] = await pool.query(
      `
      SELECT ua.*, iq.question_text, iq.question_type, iq.level,
             var.pronunciation_score, var.emotion, var.speed_wpm, 
             var.filler_count, var.pitch_variation
      FROM user_answers ua
      JOIN interview_questions iq ON ua.question_id = iq.id
      LEFT JOIN voice_analysis_results var ON ua.id = var.answer_id
      WHERE ua.id = ?
    `,
      [answerId]
    );
    return rows[0];
  }

  static async getSessionAnswersWithAnalysis(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT ua.*, iq.question_text, iq.question_type, iq.level,
             var.pronunciation_score, var.emotion, var.speed_wpm, 
             var.filler_count, var.pitch_variation
      FROM user_answers ua
      JOIN interview_questions iq ON ua.question_id = iq.id
      LEFT JOIN voice_analysis_results var ON ua.id = var.answer_id
      WHERE ua.session_id = ?
      ORDER BY ua.created_at
    `,
      [sessionId]
    );
    return rows;
  }
}

module.exports = UserAnswer;
