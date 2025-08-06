const pool = require("../config/db");

class VoiceAnalysis {
  static async create(analysisData) {
    const { answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation } = analysisData;
    const [result] = await pool.query(
      "INSERT INTO voice_analysis_results (answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation) VALUES (?, ?, ?, ?, ?, ?)",
      [answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT var.*, ua.audio_path, ua.transcription, ua.session_id,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE var.id = ?
    `, [id]);
    return rows[0];
  }

  static async findByAnswerId(answerId) {
    const [rows] = await pool.query(`
      SELECT var.*, ua.audio_path, ua.transcription, ua.session_id,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE var.answer_id = ?
    `, [answerId]);
    return rows[0];
  }

  static async findBySessionId(sessionId) {
    const [rows] = await pool.query(`
      SELECT var.*, ua.audio_path, ua.transcription,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE ua.session_id = ?
      ORDER BY var.id
    `, [sessionId]);
    return rows;
  }

  static async update(answerId, updateData) {
    const { pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation } = updateData;
    const [result] = await pool.query(
      "UPDATE voice_analysis_results SET pronunciation_score = ?, emotion = ?, speed_wpm = ?, filler_count = ?, pitch_variation = ? WHERE answer_id = ?",
      [pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation, answerId]
    );
    return result.affectedRows > 0;
  }

  static async delete(answerId) {
    const [result] = await pool.query("DELETE FROM voice_analysis_results WHERE answer_id = ?", [answerId]);
    return result.affectedRows > 0;
  }

  static async getSessionAnalysis(sessionId) {
    const [rows] = await pool.query(`
      SELECT 
        AVG(var.pronunciation_score) as avg_pronunciation,
        AVG(var.speed_wpm) as avg_speed,
        AVG(var.filler_count) as avg_filler_count,
        AVG(var.pitch_variation) as avg_pitch_variation,
        COUNT(*) as total_analyses
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      WHERE ua.session_id = ?
    `, [sessionId]);
    return rows[0];
  }

  static async getUserAnalysisStats(userId) {
    const [rows] = await pool.query(`
      SELECT 
        AVG(var.pronunciation_score) as avg_pronunciation,
        AVG(var.speed_wpm) as avg_speed,
        AVG(var.filler_count) as avg_filler_count,
        AVG(var.pitch_variation) as avg_pitch_variation,
        COUNT(*) as total_analyses
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_sessions is ON ua.session_id = is.id
      WHERE is.user_id = ?
    `, [userId]);
    return rows[0];
  }
}

module.exports = VoiceAnalysis; 