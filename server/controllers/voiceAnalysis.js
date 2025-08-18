const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// --- AssemblyAI 설정 ---
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY; // 여기에 발급받은 API 키를 넣으세요.
const assemblyai = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: ASSEMBLYAI_API_KEY,
    "content-type": "application/json",
  },
});

// --- 데이터베이스 설정 ---
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "bluesun1889!!",
  database: "open_source_db",
};

/**
 * AssemblyAI API를 사용하여 음성 파일을 분석하는 전체 프로세스
 * @param {string} mp3FilePath - 분석할 MP3 파일의 절대 경로
 * @returns {Promise<object>} 최종 분석 결과 객체
 */
async function analyzeWithAssemblyAI(mp3FilePath) {
  console.log("[Node.js] 1. AssemblyAI에 파일 업로드 시작...");

  // 1. 로컬 파일을 읽어 AssemblyAI 서버에 업로드
  const fileData = await fs.readFile(mp3FilePath);
  const uploadResponse = await assemblyai.post("/upload", fileData);
  const upload_url = uploadResponse.data.upload_url;
  console.log("[Node.js] 파일 업로드 성공! URL:", upload_url);

  // 2. 업로드된 파일 URL로 음성 분석(Transcription) 요청
  console.log("[Node.js] 2. 음성 분석 요청...");
  const transcriptResponse = await assemblyai.post("/transcript", {
    audio_url: upload_url,
    sentiment_analysis: true, // 감정 분석 활성화
    // auto_highlights: true, // 자동 하이라이트 (WPM 계산에 도움)
  });
  const transcript_id = transcriptResponse.data.id;
  console.log("[Node.js] 분석 요청 성공! 작업 ID:", transcript_id);

  // 3. 분석이 완료될 때까지 주기적으로 결과 확인 (Polling)
  console.log("[Node.js] 3. 분석 완료 대기 중...");
  while (true) {
    const pollResponse = await assemblyai.get(`/transcript/${transcript_id}`);
    const status = pollResponse.data.status;

    if (status === "completed") {
      console.log("[Node.js] 분석 완료!");
      return pollResponse.data; // 최종 결과 반환
    } else if (status === "error") {
      throw new Error(`AssemblyAI 분석 실패: ${pollResponse.data.error}`);
    } else {
      // 2초 대기 후 다시 확인
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

/**
 * 분석 결과를 DB에 저장하는 메인 함수
 * @param {number} answerId
 * @param {string} mp3FilePath
 */
async function analyzeAndSave(answerId, mp3FilePath) {
  try {
    const result = await analyzeWithAssemblyAI(mp3FilePath);

    // AssemblyAI 결과에서 필요한 데이터 추출 및 가공
    const sentimentResult =
      result.sentiment_analysis_results.find(
        (r) => r.sentiment !== "NEUTRAL"
      ) || result.sentiment_analysis_results[0];

    const voiceAnalysisData = {
      answer_id: answerId,
      // 전체 텍스트에 대한 신뢰도를 발음 점수로 활용
      pronunciation_score: parseFloat(result.confidence.toFixed(2)),
      // 감정 분석 결과 (POSITIVE, NEGATIVE, NEUTRAL)
      emotion: sentimentResult ? sentimentResult.sentiment : "N/A",
      // API가 직접 제공하는 WPM 값 활용
      speed_wpm: result.words_per_minute,
      // API가 감지한 필러 단어의 총 개수
      filler_count: result.words.filter((word) => word.word_type === "filler")
        .length,
      // AssemblyAI는 음높이 분석을 직접 제공하지 않음
      pitch_variation: 0.0,
    };

    // --- 분석 결과 요약 출력 ---
    console.log("\n[Node.js] 4. 분석 결과 요약:");
    console.table(voiceAnalysisData);
    const transcriptPreview = (result.text || "").trim();
    if (transcriptPreview) {
      const preview =
        transcriptPreview.length > 200
          ? transcriptPreview.slice(0, 200) + "..."
          : transcriptPreview;
      console.log("[Node.js] 전사 텍스트(일부):", preview);
    }

    // 데이터베이스에 저장
    const pool = await mysql.createPool(dbConfig);
    const connection = await pool.getConnection();

    const sql = `
            INSERT INTO voice_analysis_results 
            (answer_id, pronunciation_score, emotion, speed_wpm, filler_count, pitch_variation)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            pronunciation_score = VALUES(pronunciation_score),
            emotion = VALUES(emotion),
            speed_wpm = VALUES(speed_wpm),
            filler_count = VALUES(filler_count),
            pitch_variation = VALUES(pitch_variation)
        `;
    const values = [
      voiceAnalysisData.answer_id,
      voiceAnalysisData.pronunciation_score,
      voiceAnalysisData.emotion,
      voiceAnalysisData.speed_wpm,
      voiceAnalysisData.filler_count,
      voiceAnalysisData.pitch_variation,
    ];

    const [dbResult] = await connection.execute(sql, values);
    connection.release();

    console.log(
      `[Node.js] ${answerId}번 답변 음성 분석 결과 DB 저장/업데이트 성공!`
    );
    return voiceAnalysisData;
  } catch (error) {
    console.error("[Node.js] 최종 처리 중 에러 발생:", error.message);
    throw error;
  }
}

// --- 예시 실행 ---
const exampleAnswerId = 103;
const exampleMp3Path = path.join(__dirname, "User.wav"); // 분석할 mp3 파일

analyzeAndSave(exampleAnswerId, exampleMp3Path)
  .then((result) => console.log("최종 성공:", result))
  .catch((error) => {
    console.error("최종 실패:", error.message);
  });
