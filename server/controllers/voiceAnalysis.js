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
  password: "",
  database: "",
};

/**
 * AssemblyAI API를 사용하여 단일 음성 파일을 분석하는 함수
 * @param {string} audioFilePath - 분석할 오디오 파일의 절대 경로
 * @returns {Promise<object>} 최종 분석 결과 객체
 */
async function analyzeWithAssemblyAI(audioFilePath) {
  console.log(`[분석 시작] ${path.basename(audioFilePath)} 파일 업로드 중...`);

  const fileData = await fs.readFile(audioFilePath);
  const uploadResponse = await assemblyai.post("/upload", fileData);
  const upload_url = uploadResponse.data.upload_url;

  const transcriptResponse = await assemblyai.post("/transcript", {
    audio_url: upload_url,
    sentiment_analysis: true,
  });
  const transcript_id = transcriptResponse.data.id;
  console.log(`[작업 ID: ${transcript_id}] 분석 요청 완료, 결과 대기 중...`);

  while (true) {
    const pollResponse = await assemblyai.get(`/transcript/${transcript_id}`);
    const status = pollResponse.data.status;

    if (status === "completed") {
      console.log(`[작업 ID: ${transcript_id}] 분석 성공!`);
      return pollResponse.data;
    } else if (status === "error") {
      throw new Error(`AssemblyAI 분석 실패: ${pollResponse.data.error}`);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

/**
 * 단일 분석 결과를 DB에 저장하는 함수
 * @param {number | string} answerId
 * @param {string} audioFilePath
 */
async function analyzeAndSave(answerId, audioFilePath) {
  try {
    const result = await analyzeWithAssemblyAI(audioFilePath);

    const sentimentResult =
      result.sentiment_analysis_results.find(
        (r) => r.sentiment !== "NEUTRAL"
      ) || result.sentiment_analysis_results[0];

    const voiceAnalysisData = {
      answer_id: answerId,
      pronunciation_score: parseFloat(result.confidence.toFixed(2)),
      emotion: sentimentResult ? sentimentResult.sentiment : "N/A",
      speed_wpm: result.words_per_minute,
      filler_count: result.words.filter((word) => word.word_type === "filler")
        .length,
      pitch_variation: 0.0,
    };

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

    await connection.execute(sql, values);
    connection.release();

    console.log(`[DB 저장] answer_id: ${answerId} 분석 결과 저장 완료.`);
    return voiceAnalysisData;
  } catch (error) {
    console.error(
      `[에러] answer_id: ${answerId} 처리 중 오류 발생:`,
      error.message
    );
    // 에러가 발생해도 다음 파일 처리를 위해 에러를 던지지 않고 null을 반환할 수 있습니다.
    return null;
  }
}

/**
 * 지정된 디렉토리의 모든 오디오 파일을 순차적으로 분석하는 메인 실행 함수
 * @param {string} directoryPath - 분석할 파일들이 들어있는 폴더 경로
 */
async function analyzeAllFilesInDirectory(directoryPath) {
  console.log(
    `[배치 작업 시작] '${directoryPath}' 폴더의 모든 음성 파일을 분석합니다.`
  );
  try {
    const files = await fs.readdir(directoryPath);
    const audioFiles = files.filter(
      (file) =>
        file.endsWith(".wav") || file.endsWith(".mp3") || file.endsWith(".m4a")
    );

    if (audioFiles.length === 0) {
      console.log("분석할 오디오 파일이 폴더에 없습니다.");
      return;
    }

    console.log(`총 ${audioFiles.length}개의 파일을 분석합니다.`);

    for (const file of audioFiles) {
      const fullPath = path.join(directoryPath, file);
      // 파일 이름에서 확장자를 제거하여 answer_id로 사용
      const answerId = path.parse(file).name;

      console.log(
        `\n--- (${audioFiles.indexOf(file) + 1}/${
          audioFiles.length
        }) ${file} 처리 시작 ---`
      );
      await analyzeAndSave(answerId, fullPath);
      console.log(`--- ${file} 처리 완료 ---`);
    }
    console.log("\n[배치 작업 완료] 모든 파일 분석 및 저장이 완료되었습니다.");
  } catch (error) {
    console.error(
      "[배치 작업 에러] 폴더를 읽는 중 오류가 발생했습니다:",
      error
    );
  }
}

// --- 배치 작업 실행 ---
// 'audio_files' 라는 폴더에 있는 모든 음성 파일을 분석하도록 설정합니다.
// 폴더 이름은 실제 환경에 맞게 변경하여 사용하세요.
const targetDirectory = path.join(__dirname, "audio_files");
analyzeAllFilesInDirectory(targetDirectory);
