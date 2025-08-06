const pool = require("../config/db");

class User {
  static async create(userData) {
    const { email, password_hash, nickname, interest_company } = userData;
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, nickname, interest_company) VALUES (?, ?, ?, ?)",
      [email, password_hash, nickname, interest_company]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  static async update(id, updateData) {
    const { nickname, interest_company } = updateData;
    const [result] = await pool.query(
      "UPDATE users SET nickname = ?, interest_company = ? WHERE id = ?",
      [nickname, interest_company, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.query(
      "SELECT id, email, nickname, interest_company, created_at FROM users"
    );
    return rows;
  }
}

module.exports = User;
