const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken } = require("../config/dbConfig");
const aiInterviewController = require("../controllers/aiInterviewController");
const path = require("path");
const fs = require("fs");

// multer 설정 - 메모리에 파일 저장
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 오디오 파일만 허용
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("오디오 파일만 업로드 가능합니다."), false);
    }
  },
});

// AI 인터뷰 세션 시작
router.post(
  "/session/start",
  verifyToken,
  aiInterviewController.startInterviewSession
);

// AI 인터뷰 세션 종료
router.post(
  "/session/end",
  verifyToken,
  aiInterviewController.endInterviewSession
);

// 음성 인식 (STT) - 사용자 음성을 텍스트로 변환
router.post(
  "/transcribe",
  verifyToken,
  upload.single("audio"),
  aiInterviewController.transcribeAudio
);

// AI 인터뷰어와의 대화 처리
router.post("/chat", verifyToken, aiInterviewController.handleChat);

// AI 면접 질문 생성 (5단계 프로세스)
router.post("/generate-question", verifyToken, aiInterviewController.generateQuestion);

// 오디오 파일 다운로드 (필요시)
router.get("/audio/:filename", verifyToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../controllers/audio_files", filename);

  console.log("오디오 파일 요청:", filename);
  console.log("파일 경로:", filePath);

  if (fs.existsSync(filePath)) {
    console.log("파일 존재, 다운로드 시작");
    res.download(filePath);
  } else {
    console.error("파일을 찾을 수 없음:", filePath);
    res.status(404).json({ success: false, error: "파일을 찾을 수 없습니다." });
  }
});

// AI 오디오 파일 다운로드 (필요시)
router.get("/audio/ai/:filename", verifyToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(
    __dirname,
    "../controllers/audio_files_AI",
    filename
  );

  console.log("AI 오디오 파일 요청:", filename);
  console.log("파일 경로:", filePath);

  if (fs.existsSync(filePath)) {
    console.log("파일 존재, 다운로드 시작");
    res.download(filePath);
  } else {
    console.error("파일을 찾을 수 없음:", filePath);
    res.status(404).json({ success: false, error: "파일을 찾을 수 없습니다." });
  }
});

module.exports = router;
