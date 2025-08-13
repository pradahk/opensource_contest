const pool = require("../config/db");

class SelfIntroduction {
  // 자기소개서 생성
  static async create(selfIntroductionData) {
    const connection = await pool.getConnection();
    try {
      const { user_id, title, content } = selfIntroductionData;

      const [result] = await connection.query(
        `INSERT INTO self_introductions (user_id, title, content) VALUES (?, ?, ?)`,
        [user_id, title, content]
      );

      return {
        id: result.insertId,
        user_id,
        title,
        content,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  // ID로 자기소개서 조회
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM self_introductions WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // 사용자별 자기소개서 목록 조회
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM self_introductions WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // 자기소개서 업데이트
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      const { title, content } = updateData;
      const [result] = await connection.query(
        `UPDATE self_introductions SET title = ?, content = ?, updated_at = NOW() WHERE id = ?`,
        [title, content, id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 자기소개서 삭제
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `DELETE FROM self_introductions WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 사용자의 자기소개서 수 조회
  static async countByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM self_introductions WHERE user_id = ?`,
        [userId]
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }
}

module.exports = SelfIntroduction;
