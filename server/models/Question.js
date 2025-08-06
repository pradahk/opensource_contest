const pool = require("../config/db");

class Question {
  static async create(questionData) {
    const { company_id, job_position, question_text, question_type, level } =
      questionData;
    const [result] = await pool.query(
      "INSERT INTO interview_questions (company_id, job_position, question_text, question_type, level) VALUES (?, ?, ?, ?, ?)",
      [company_id, job_position, question_text, question_type, level]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT iq.*, c.name as company_name 
      FROM interview_questions iq
      LEFT JOIN companies c ON iq.company_id = c.id
      WHERE iq.id = ?
    `,
      [id]
    );
    return rows[0];
  }

  static async findByCompany(companyId) {
    const [rows] = await pool.query(
      "SELECT * FROM interview_questions WHERE company_id = ? ORDER BY level, created_at",
      [companyId]
    );
    return rows;
  }

  static async findByType(questionType) {
    const [rows] = await pool.query(
      "SELECT * FROM interview_questions WHERE question_type = ? ORDER BY level, created_at",
      [questionType]
    );
    return rows;
  }

  static async findByLevel(level) {
    const [rows] = await pool.query(
      "SELECT * FROM interview_questions WHERE level = ? ORDER BY created_at",
      [level]
    );
    return rows;
  }

  static async getRandomQuestions(limit = 10, filters = {}) {
    let query = "SELECT * FROM interview_questions WHERE 1=1";
    const params = [];

    if (filters.company_id) {
      query += " AND company_id = ?";
      params.push(filters.company_id);
    }

    if (filters.question_type) {
      query += " AND question_type = ?";
      params.push(filters.question_type);
    }

    if (filters.level) {
      query += " AND level = ?";
      params.push(filters.level);
    }

    query += " ORDER BY RAND() LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async update(id, updateData) {
    const { company_id, job_position, question_text, question_type, level } =
      updateData;
    const [result] = await pool.query(
      "UPDATE interview_questions SET company_id = ?, job_position = ?, question_text = ?, question_type = ?, level = ? WHERE id = ?",
      [company_id, job_position, question_text, question_type, level, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM interview_questions WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.query(`
      SELECT iq.*, c.name as company_name 
      FROM interview_questions iq
      LEFT JOIN companies c ON iq.company_id = c.id
      ORDER BY iq.created_at DESC
    `);
    return rows;
  }
}

module.exports = Question;
