const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/dbConfig");

const getUserProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [users] = await pool.query(
      "SELECT id, email, nickname, interest_company, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다." });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    res
      .status(500)
      .json({ message: "서버 오류로 프로필 정보를 가져오는데 실패했습니다." });
  }
};

// 사용자 관심기업 관련
const getUserInterestCompanies = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [rows] = await pool.query(`
      SELECT c.id, c.name 
      FROM companies c
      INNER JOIN user_interest_companies uic ON c.id = uic.company_id
      WHERE uic.user_id = ?
      ORDER BY uic.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("관심기업 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "관심기업 조회 중 오류가 발생했습니다."
    });
  }
};

const addUserInterestCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "기업 ID가 필요합니다."
      });
    }

    await pool.query(`
      INSERT INTO user_interest_companies (user_id, company_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `, [userId, companyId]);

    res.json({
      success: true,
      message: "관심기업이 추가되었습니다."
    });
  } catch (error) {
    console.error("관심기업 추가 오류:", error);
    res.status(500).json({
      success: false,
      message: "관심기업 추가 중 오류가 발생했습니다."
    });
  }
};

const removeUserInterestCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { companyId } = req.params;

    await pool.query(`
      DELETE FROM user_interest_companies 
      WHERE user_id = ? AND company_id = ?
    `, [userId, companyId]);

    res.json({
      success: true,
      message: "관심기업이 제거되었습니다."
    });
  } catch (error) {
    console.error("관심기업 제거 오류:", error);
    res.status(500).json({
      success: false,
      message: "관심기업 제거 중 오류가 발생했습니다."
    });
  }
};

// 자기소개서 관련
const getSelfIntroductions = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [rows] = await pool.query(`
      SELECT id, title, content, created_at, updated_at
      FROM self_introductions
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("자기소개서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "자기소개서 조회 중 오류가 발생했습니다."
    });
  }
};

const createSelfIntroduction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요."
      });
    }

    const [result] = await pool.query(`
      INSERT INTO self_introductions (user_id, title, content)
      VALUES (?, ?, ?)
    `, [userId, title, content]);

    res.json({
      success: true,
      message: "자기소개서가 저장되었습니다.",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("자기소개서 저장 오류:", error);
    res.status(500).json({
      success: false,
      message: "자기소개서 저장 중 오류가 발생했습니다."
    });
  }
};

const updateSelfIntroduction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요."
      });
    }

    const [result] = await pool.query(`
      UPDATE self_introductions 
      SET title = ?, content = ?
      WHERE id = ? AND user_id = ?
    `, [title, content, id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "자기소개서를 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      message: "자기소개서가 수정되었습니다."
    });
  } catch (error) {
    console.error("자기소개서 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "자기소개서 수정 중 오류가 발생했습니다."
    });
  }
};

const deleteSelfIntroduction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [result] = await pool.query(`
      DELETE FROM self_introductions 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "자기소개서를 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      message: "자기소개서가 삭제되었습니다."
    });
  } catch (error) {
    console.error("자기소개서 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "자기소개서 삭제 중 오류가 발생했습니다."
    });
  }
};

// 이력서 관련
const getResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [rows] = await pool.query(`
      SELECT id, title, content, created_at, updated_at
      FROM resumes
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("이력서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "이력서 조회 중 오류가 발생했습니다."
    });
  }
};

const createResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요."
      });
    }

    const [result] = await pool.query(`
      INSERT INTO resumes (user_id, title, content)
      VALUES (?, ?, ?)
    `, [userId, title, content]);

    res.json({
      success: true,
      message: "이력서가 저장되었습니다.",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("이력서 저장 오류:", error);
    res.status(500).json({
      success: false,
      message: "이력서 저장 중 오류가 발생했습니다."
    });
  }
};

const updateResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요."
      });
    }

    const [result] = await pool.query(`
      UPDATE resumes 
      SET title = ?, content = ?
      WHERE id = ? AND user_id = ?
    `, [title, content, id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "이력서를 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      message: "이력서가 수정되었습니다."
    });
  } catch (error) {
    console.error("이력서 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "이력서 수정 중 오류가 발생했습니다."
    });
  }
};

const deleteResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [result] = await pool.query(`
      DELETE FROM resumes 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "이력서를 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      message: "이력서가 삭제되었습니다."
    });
  } catch (error) {
    console.error("이력서 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "이력서 삭제 중 오류가 발생했습니다."
    });
  }
};

// 사용자 통계 정보
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 면접 세션 수
    const [sessionCount] = await pool.query(`
      SELECT COUNT(*) as count FROM interview_sessions WHERE user_id = ?
    `, [userId]);

    // 자기소개서 수
    const [introCount] = await pool.query(`
      SELECT COUNT(*) as count FROM self_introductions WHERE user_id = ?
    `, [userId]);

    // 이력서 수
    const [resumeCount] = await pool.query(`
      SELECT COUNT(*) as count FROM resumes WHERE user_id = ?
    `, [userId]);

    // 관심기업 수
    const [companyCount] = await pool.query(`
      SELECT COUNT(*) as count FROM user_interest_companies WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: {
        interviews: sessionCount[0].count,
        intros: introCount[0].count,
        resumes: resumeCount[0].count,
        companies: companyCount[0].count
      }
    });
  } catch (error) {
    console.error("사용자 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "사용자 통계 조회 중 오류가 발생했습니다."
    });
  }
};

module.exports = {
  getUserProfile,
  getUserInterestCompanies,
  addUserInterestCompany,
  removeUserInterestCompany,
  getSelfIntroductions,
  createSelfIntroduction,
  updateSelfIntroduction,
  deleteSelfIntroduction,
  getResumes,
  createResume,
  updateResume,
  deleteResume,
  getUserStats
};
