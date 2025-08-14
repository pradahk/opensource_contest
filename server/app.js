const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// 미들웨어 설정
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-request-id",
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// 라우터 설정
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user");
const companyRoutes = require("./routes/companyRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aiInterviewRoutes = require("./routes/aiInterviewRoutes");
const questionRoutes = require("./routes/questionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const voiceRoutes = require("./routes/voiceRoutes");

// API 라우터
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/ai-interview", aiInterviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/voice", voiceRoutes);

// 기본 라우트
app.get("/", (req, res) => {
  res.json({ message: "InnoView API 서버가 실행 중입니다." });
});

// 404 에러 핸들러
app.use("*", (req, res) => {
  res.status(404).json({ message: "요청한 엔드포인트를 찾을 수 없습니다." });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error("서버 오류:", err);
  res.status(500).json({
    message: "서버 내부 오류가 발생했습니다.",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;
