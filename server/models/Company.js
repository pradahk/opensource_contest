const pool = require("../config/db");

class Company {
  static async create(companyData) {
    const { name } = companyData;
    const [result] = await pool.query(
      "INSERT INTO companies (name) VALUES (?)",
      [name]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM companies WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  static async findByName(name) {
    const [rows] = await pool.query("SELECT * FROM companies WHERE name = ?", [
      name,
    ]);
    return rows[0];
  }

  static async update(id, updateData) {
    const { name } = updateData;
    const [result] = await pool.query(
      "UPDATE companies SET name = ? WHERE id = ?",
      [name, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query("DELETE FROM companies WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.query("SELECT * FROM companies ORDER BY name");
    return rows;
  }

  static async getWithQuestions(id) {
    const [rows] = await pool.query(
      `
      SELECT c.*, 
             COUNT(iq.id) as question_count
      FROM companies c
      LEFT JOIN interview_questions iq ON c.id = iq.company_id
      WHERE c.id = ?
      GROUP BY c.id
    `,
      [id]
    );
    return rows[0];
  }
}

module.exports = Company;
