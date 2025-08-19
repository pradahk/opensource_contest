const pool = require("../config/db");

class VoiceAnalysis {
  // 통합된 음성 분석 결과 생성
  static async create(analysisData) {
    const {
      answer_id,
      pronunciation_score,
      emotion,
      speed_wpm,
      filler_count,
      pitch_variation = 0.0,
      confidence_score,
      analysis_type = "assemblyai",
      raw_analysis_data,
    } = analysisData;

    const [result] = await pool.query(
      `INSERT INTO voice_analysis_results 
       (answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation, 
        confidence_score, analysis_type, raw_analysis_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        answer_id,
        pronunciation_score,
        emotion,
        speed_wpm,
        filler_count,
        pitch_variation,
        confidence_score,
        analysis_type,
        raw_analysis_data ? JSON.stringify(raw_analysis_data) : null,
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT var.*, ua.audio_path, ua.transcription, ua.session_id,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE var.id = ?
    `,
      [id]
    );
    return rows[0];
  }

  static async findByAnswerId(answerId) {
    const [rows] = await pool.query(
      `
      SELECT var.*, ua.audio_path, ua.transcription, ua.session_id,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE var.answer_id = ?
    `,
      [answerId]
    );
    return rows[0];
  }

  static async findBySessionId(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT var.*, ua.audio_path, ua.transcription,
             iq.question_text, iq.question_type, iq.level
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_questions iq ON ua.question_id = iq.id
      WHERE ua.session_id = ?
      ORDER BY var.id
    `,
      [sessionId]
    );
    return rows;
  }

  // 통합된 음성 분석 결과 업데이트
  static async update(answerId, updateData) {
    const {
      pronunciation_score,
      emotion,
      speed_wpm,
      filler_count,
      pitch_variation,
      confidence_score,
      analysis_type,
      raw_analysis_data,
    } = updateData;

    const [result] = await pool.query(
      `UPDATE voice_analysis_results 
       SET pronunciation_score = ?, emotion = ?, speed_wpm = ?, filler_count = ?, 
           pitch_variation = ?, confidence_score = ?, analysis_type = ?, raw_analysis_data = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE answer_id = ?`,
      [
        pronunciation_score,
        emotion,
        speed_wpm,
        filler_count,
        pitch_variation,
        confidence_score,
        analysis_type,
        raw_analysis_data ? JSON.stringify(raw_analysis_data) : null,
        answerId,
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(answerId) {
    const [result] = await pool.query(
      "DELETE FROM voice_analysis_results WHERE answer_id = ?",
      [answerId]
    );
    return result.affectedRows > 0;
  }

  static async getSessionAnalysis(sessionId) {
    const [rows] = await pool.query(
      `
      SELECT 
        AVG(var.pronunciation_score) as avg_pronunciation,
        AVG(var.speed_wpm) as avg_speed,
        AVG(var.filler_count) as avg_filler_count,
        AVG(var.pitch_variation) as avg_pitch_variation,
        COUNT(*) as total_analyses
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      WHERE ua.session_id = ?
    `,
      [sessionId]
    );
    return rows[0];
  }

  static async getUserAnalysisStats(userId) {
    const [rows] = await pool.query(
      `
      SELECT 
        AVG(var.pronunciation_score) as avg_pronunciation,
        AVG(var.speed_wpm) as avg_speed,
        AVG(var.filler_count) as avg_filler_count,
        AVG(var.pitch_variation) as avg_pitch_variation,
        AVG(var.confidence_score) as avg_confidence,
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN var.analysis_type = 'assemblyai' THEN 1 END) as assemblyai_count,
        COUNT(CASE WHEN var.analysis_type = 'openai' THEN 1 END) as openai_count,
        COUNT(CASE WHEN var.analysis_type = 'combined' THEN 1 END) as combined_count
      FROM voice_analysis_results var
      JOIN user_answers ua ON var.answer_id = ua.id
      JOIN interview_sessions is ON ua.session_id = is.id
      WHERE is.user_id = ?
    `,
      [userId]
    );
    return rows[0];
  }

  // AI 면접 답변을 위한 음성 분석 (통합 시스템)
  static async createForAIAnswer(aiAnswerId, analysisData) {
    const {
      pronunciation_score,
      emotion,
      speed_wpm,
      filler_count,
      pitch_variation = 0.0,
      confidence_score,
      raw_analysis_data,
    } = analysisData;

    const [result] = await pool.query(
      `INSERT INTO voice_analysis_results 
       (answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation, 
        confidence_score, analysis_type, raw_analysis_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'combined', ?)`,
      [
        aiAnswerId,
        pronunciation_score,
        emotion,
        speed_wpm,
        filler_count,
        pitch_variation,
        confidence_score,
        raw_analysis_data ? JSON.stringify(raw_analysis_data) : null,
      ]
    );
    return result.insertId;
  }

  // AI 세션의 답변들에 대한 음성 분석 조회
  static async findByAISessionId(aiSessionId) {
    const [rows] = await pool.query(
      `
      SELECT var.*, aia.audio_path, aia.transcription,
             aiq.question_text, aiq.question_type
      FROM voice_analysis_results var
      JOIN ai_interview_answers aia ON var.answer_id = aia.id
      JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
      WHERE aia.session_id = ?
      ORDER BY var.id
    `,
      [aiSessionId]
    );
    return rows;
  }

  // 분석 타입별 통계
  static async getAnalysisTypeStats() {
    const [rows] = await pool.query(`
      SELECT 
        analysis_type,
        COUNT(*) as count,
        AVG(pronunciation_score) as avg_pronunciation,
        AVG(confidence_score) as avg_confidence,
        AVG(speed_wpm) as avg_speed
      FROM voice_analysis_results
      GROUP BY analysis_type
    `);
    return rows;
  }

  // 통합된 음성 분석 결과 조회 (일반 + AI 면접)
  static async getUnifiedAnalysis(answerId, answerType = "user") {
    let query;
    if (answerType === "ai") {
      query = `
        SELECT var.*, aia.audio_path, aia.transcription, aia.session_id,
               aiq.question_text, aiq.question_type, 'ai_interview' as source_type
        FROM voice_analysis_results var
        JOIN ai_interview_answers aia ON var.answer_id = aia.id
        JOIN ai_interview_questions aiq ON aia.question_id = aiq.id
        WHERE var.answer_id = ?
      `;
    } else {
      query = `
        SELECT var.*, ua.audio_path, ua.transcription, ua.session_id,
               iq.question_text, iq.question_type, iq.level, 'regular_interview' as source_type
        FROM voice_analysis_results var
        JOIN user_answers ua ON var.answer_id = ua.id
        JOIN interview_questions iq ON ua.question_id = iq.id
        WHERE var.answer_id = ?
      `;
    }

    const [rows] = await pool.query(query, [answerId]);
    return rows[0];
  }
}

module.exports = VoiceAnalysis;
