const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET이 환경 변수에 설정되지 않았습니다.");
}

// 수정된 register
exports.register = async (req, res) => {
  const { email, password, nickname, interest_company } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호는 필수입니다." });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "이미 등록된 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, nickname, interest_company)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, nickname || null, interest_company || null]
    );

    res.status(201).json({ message: "회원가입 성공", userId: result.insertId });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류로 회원가입에 실패했습니다." });
  }
};

// 수정된 login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        interest_company: user.interest_company,
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류로 로그인에 실패했습니다." });
  }
};
