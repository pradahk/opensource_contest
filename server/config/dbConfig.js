const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// 데이터베이스 연결 설정
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "innoview",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 데이터베이스 스키마 생성 함수
const createTables = async (pool) => {
  try {
    // Users 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        interest_company VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Companies 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 기본 기업 데이터 추가
    await pool.query(`
      INSERT IGNORE INTO companies (name) VALUES 
      ('삼성전자'),
      ('LG화학'),
      ('카카오'),
      ('현대자동차'),
      ('네이버'),
      ('SK하이닉스'),
      ('포스코'),
      ('KT'),
      ('LG전자'),
      ('롯데정보통신'),
      ('배달의민족')
    `);

    // User_Interest_Companies 테이블 (사용자 관심기업)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interest_companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_company (user_id, company_id)
      )
    `);

    // Self_Introductions 테이블 (자기소개서)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS self_introductions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Resumes 테이블 (이력서)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Interview_Sessions 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_uuid VARCHAR(255) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        company_id INT NULL DEFAULT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      )
    `);

    // Interview_Questions 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interview_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        job_position VARCHAR(255) NOT NULL,
        question_text TEXT NOT NULL,
        question_type ENUM('behavioral', 'technical', 'general') NOT NULL,
        level ENUM('easy', 'medium', 'hard') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      )
    `);

    // 기본 면접 질문 추가
    await pool.query(`
      INSERT IGNORE INTO interview_questions (company_id, job_position, question_text, question_type, level) VALUES 
      (1, '개발자', '자기소개를 해주세요.', 'general', 'easy'),
      (1, '개발자', '왜 삼성전자에 지원하셨나요?', 'behavioral', 'medium'),
      (1, '개발자', '가장 도전적인 프로젝트는 무엇이었나요?', 'behavioral', 'hard'),
      (2, '개발자', 'LG화학에서 일하고 싶은 이유는 무엇인가요?', 'behavioral', 'medium'),
      (2, '개발자', '팀워크가 중요한 이유는 무엇인가요?', 'behavioral', 'medium'),
      (3, '개발자', '카카오의 서비스 중 가장 관심 있는 것은 무엇인가요?', 'behavioral', 'medium'),
      (3, '개발자', '사용자 경험을 개선한 경험이 있나요?', 'behavioral', 'hard'),
      (4, '개발자', '현대자동차의 미래 기술에 대해 어떻게 생각하시나요?', 'behavioral', 'medium'),
      (5, '개발자', '네이버의 AI 기술에 대해 어떻게 생각하시나요?', 'behavioral', 'medium'),
      (NULL, '개발자', '프로그래밍 언어 중 가장 익숙한 것은 무엇인가요?', 'technical', 'easy'),
      (NULL, '개발자', '데이터베이스 설계 경험이 있나요?', 'technical', 'medium'),
      (NULL, '개발자', '성능 최적화를 어떻게 하시나요?', 'technical', 'hard')
    `);

    // User_Answers 테이블
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        question_id INT NOT NULL,
        audio_path VARCHAR(500),
        transcription TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
      )
    `);

    // Voice_Analysis_Results 테이블 (통합 음성 분석)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        answer_id INT UNIQUE NOT NULL,
        pronunciation_score DECIMAL(5,2),
        emotion VARCHAR(50),
        speed_wpm INT,
        filler_count INT,
        pitch_variation DECIMAL(5,2) DEFAULT 0.0,
        confidence_score DECIMAL(5,2),
        analysis_type ENUM('assemblyai', 'openai', 'combined') DEFAULT 'assemblyai',
        raw_analysis_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (answer_id) REFERENCES user_answers(id) ON DELETE CASCADE
      )
    `);

    // Feedback_Reports 테이블 (통합 피드백)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT UNIQUE NOT NULL,
        total_score DECIMAL(5,2),
        strengths TEXT,
        weaknesses TEXT,
        suggestions TEXT,
        report TEXT,
        report_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
      )
    `);

    // AI_Interview_Sessions 테이블 (AI 면접 세션)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_interview_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_uuid VARCHAR(255) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        company_id INT NULL DEFAULT NULL,
        self_introduction_id INT NULL DEFAULT NULL,
        resume_id INT NULL DEFAULT NULL,
        current_question_number INT DEFAULT 1,
        total_questions INT DEFAULT 0,
        status ENUM('active', 'completed', 'paused') DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        thread_id VARCHAR(255) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (self_introduction_id) REFERENCES self_introductions(id) ON DELETE SET NULL,
        FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
      )
    `);

    // AI_Interview_Questions 테이블 (AI 면접 질문)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_interview_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        question_type ENUM('인성', '경험', '지식', '기타') NOT NULL,
        is_follow_up BOOLEAN DEFAULT FALSE,
        parent_question_id INT NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES ai_interview_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_question_id) REFERENCES ai_interview_questions(id) ON DELETE SET NULL
      )
    `);

    // AI_Interview_Answers 테이블 (AI 면접 답변)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_interview_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        question_id INT NOT NULL,
        audio_path VARCHAR(500) NULL,
        transcription TEXT NOT NULL,
        ai_analysis JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES ai_interview_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES ai_interview_questions(id) ON DELETE CASCADE
      )
    `);

    // AI_Interview_Feedback 테이블 (AI 면접 피드백)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_interview_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT UNIQUE NOT NULL,
        overall_score DECIMAL(3,2),
        communication_score DECIMAL(3,2),
        technical_score DECIMAL(3,2),
        personality_score DECIMAL(3,2),
        strengths TEXT,
        weaknesses TEXT,
        improvement_suggestions TEXT,
        detailed_feedback JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES ai_interview_sessions(id) ON DELETE CASCADE
      )
    `);

    console.log("데이터베이스 테이블이 성공적으로 생성되었습니다.");
  } catch (error) {
    console.error("테이블 생성 중 오류 발생:", error);
    throw error;
  }
};

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "인증 헤더가 없습니다.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "토큰이 없습니다.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "유효하지 않은 토큰입니다.",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("토큰 검증 오류:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "토큰이 만료되었습니다. 다시 로그인해주세요.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "유효하지 않은 토큰입니다.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "인증이 필요합니다.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "접근 권한이 없습니다.",
      });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "인증이 필요합니다.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "관리자 권한이 필요합니다.",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  authorizeRole,
  isAdmin,
  createTables,
  JWT_SECRET,
  pool, // 풀 객체를 모듈 내보내기
};
