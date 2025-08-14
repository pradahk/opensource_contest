const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const dotenv = require("dotenv");
const User = require("../models/User");
const SelfIntroduction = require("../models/SelfIntroduction");
const Resume = require("../models/Resume");

// .env 파일에서 환경 변수 로드
dotenv.config({
  path: ".env",
});

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// OpenAI 설정 (API 키가 있을 때만 초기화)
let openai = null;
let assistantId = null;

if (process.env.OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI(process.env.OPENAI_API_KEY);
  assistantId = process.env.BAEMIN;
}

// Google Cloud TTS 설정 (환경 변수가 있을 때만 로드)
let textToSpeech = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  textToSpeech = require("@google-cloud/text-to-speech");
}

// 오디오 파일을 저장할 디렉토리 설정
const audioDir = path.join(__dirname, "audio_files");
const aiAudioDir = path.join(__dirname, "audio_files_AI");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}
if (!fs.existsSync(aiAudioDir)) {
  fs.mkdirSync(aiAudioDir);
}

// 기업별 Assistant ID 매핑
function resolveAssistantId(companyId) {
  const mapByCode = {
    baemin: process.env.BAEMIN,
    coupang: process.env.COUPANG,
    naver: process.env.NAVER,
    kakao: process.env.KAKAO,
  };
  if (!companyId)
    return process.env.ASSISTANT_ID || process.env.BAEMIN || assistantId;
  if (typeof companyId === "string" && mapByCode[companyId]) {
    return mapByCode[companyId] || assistantId;
  }
  return process.env.ASSISTANT_ID || assistantId;
}

// 음성 인식 (STT) - 사용자 음성을 텍스트로 변환
async function transcribeAudio(req, res) {
  try {
    console.log("=== 음성 인식 시작 ===");

    // OpenAI API 키가 설정되지 않은 경우 임시 응답
    if (!process.env.OPENAI_API_KEY || !openai) {
      console.warn(
        "OpenAI API 키가 설정되지 않았습니다. 임시 응답을 반환합니다."
      );
      return res.json({
        success: true,
        transcription: "음성 인식 테스트입니다. OpenAI API 키를 설정해주세요.",
        audioFile: "temp_audio.wav",
      });
    }

    if (!req.file) {
      console.error("오디오 파일이 업로드되지 않았습니다.");
      return res.status(400).json({
        success: false,
        error: "오디오 파일이 필요합니다.",
      });
    }

    const audioBuffer = req.file.buffer;
    console.log("오디오 파일 크기:", audioBuffer.length, "bytes");

    // 고유한 파일 이름 생성
    const timestamp = Date.now();
    const outputFilename = `User[${timestamp}].wav`;
    const outputFilePath = path.join(audioDir, outputFilename);

    console.log("오디오 파일 변환 시작...");

    // ffmpeg를 사용하여 WebM을 WAV로 변환 및 저장
    await new Promise((resolve, reject) => {
      const stream = Readable.from(audioBuffer);

      ffmpeg(stream)
        .inputFormat("webm") // 입력 형식 지정
        .outputFormat("wav") // 출력 형식 지정
        .on("error", (err) => {
          console.error("오디오 변환 중 오류:", err);
          reject(err);
        })
        .on("end", () => {
          console.log("오디오 변환 완료:", outputFilePath);
          resolve();
        })
        .save(outputFilePath); // 변환된 파일을 저장할 경로 지정
    });

    const audioStream = fs.createReadStream(outputFilePath);

    console.log("OpenAI Whisper API 호출 중...");

    // OpenAI API를 사용하여 텍스트로 변환
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
    });

    console.log("=== 음성 인식 결과 ===");
    console.log("사용자 음성:", response.text);
    console.log("=== 음성 인식 완료 ===");

    res.json({
      success: true,
      transcription: response.text,
      audioFile: outputFilename,
    });
  } catch (error) {
    console.error("=== 음성 인식 오류 ===");
    console.error("오류 타입:", error.constructor.name);
    console.error("오류 메시지:", error.message);
    console.error("오류 스택:", error.stack);

    // OpenAI API 관련 오류인 경우 임시 응답
    if (
      error.code === "ECONNRESET" ||
      error.type === "system" ||
      error.name === "APIConnectionError" ||
      error.message.includes("Connection error") ||
      error.message.includes("socket hang up") ||
      error.cause?.code === "ECONNRESET" ||
      error.code === "ECANCELED"
    ) {
      console.warn("OpenAI API 연결 오류. 임시 응답을 반환합니다.");
      return res.json({
        success: true,
        transcription:
          "음성 인식 중 네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        audioFile: "error_audio.wav",
      });
    }

    // 기타 OpenAI API 오류
    if (error.name === "APIError" || error.name === "APIConnectionError") {
      console.warn("OpenAI API 오류. 임시 응답을 반환합니다.");
      return res.json({
        success: true,
        transcription:
          "음성 인식 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
        audioFile: "error_audio.wav",
      });
    }

    res.status(500).json({
      success: false,
      error: "오디오 변환 중 오류 발생",
    });
  }
}

// AI 인터뷰어와의 대화 처리
async function handleChat(req, res) {
  try {
    const userQuestion = req.body.message;
    let threadId = req.body.thread_id;
    const companyId = req.body.company_id || null;

    console.log("=== AI 인터뷰 대화 시작 ===");
    console.log("사용자 질문:", userQuestion);
    console.log("스레드 ID:", threadId);

    // OpenAI API 키가 설정되지 않은 경우 임시 응답
    if (!process.env.OPENAI_API_KEY || !openai) {
      console.warn(
        "OpenAI API 키가 설정되지 않았습니다. 임시 응답을 반환합니다."
      );
      return res.json({
        success: true,
        response:
          "안녕하세요! AI 면접을 시작하겠습니다. 현재 임시 모드로 실행 중입니다. 실제 AI 기능을 사용하려면 OpenAI API 키를 설정해주세요.",
        audioContent: null,
        audioFile: null,
        thread_id: threadId || `temp_thread_${Date.now()}`,
      });
    }

    if (!threadId) {
      // 새로운 스레드 생성
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log("새 스레드 생성됨:", threadId);
    }

    // 메시지 생성
    console.log("OpenAI 스레드에 사용자 메시지 전송 중...");
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userQuestion,
    });
    console.log("사용자 메시지가 성공적으로 전송되었습니다.");

    // Assistant 실행
    console.log("Assistant 실행 시작...");
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: resolveAssistantId(companyId),
    });
    console.log("Assistant 실행 ID:", run.id);

    // 실행 상태 확인
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log("초기 실행 상태:", runStatus.status);

    // Assistant가 완료될 때까지 대기 (최대 60초)
    let waitTime = 0;
    const maxWaitTime = 60000; // 60초

    while (runStatus.status !== "completed" && waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초마다 확인
      waitTime += 2000;

      try {
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`실행 상태 (${waitTime / 1000}초):`, runStatus.status);
      } catch (statusError) {
        console.error("실행 상태 확인 중 오류:", statusError);
        break;
      }

      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        console.log(
          `실행 상태: '${runStatus.status}', 요청을 실행할 수 없습니다.`
        );
        return res.status(500).json({
          success: false,
          error: "Assistant 실행 실패",
        });
      }
    }

    if (waitTime >= maxWaitTime) {
      console.error("Assistant 실행 시간 초과");
      return res.status(500).json({
        success: false,
        error: "Assistant 응답 시간이 초과되었습니다.",
      });
    }

    // 마지막 Assistant 메시지 가져오기
    console.log("Assistant 응답 가져오는 중...");
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;
      console.log("=== AI 응답 ===");
      console.log("Assistant 응답:", assistantResponseText);
      console.log("=== 대화 완료 ===");

      // TTS 처리 (Google Cloud TTS가 설정되지 않은 경우 텍스트만 반환)
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !textToSpeech) {
        console.warn(
          "Google Cloud TTS가 설정되지 않았습니다. 텍스트만 반환합니다."
        );
        return res.json({
          success: true,
          response: assistantResponseText,
          audioContent: null,
          audioFile: null,
          thread_id: threadId,
        });
      }

      const client = new textToSpeech.TextToSpeechClient();

      const ttsRequest = {
        input: { text: assistantResponseText },
        voice: { languageCode: "en-US", name: "en-US-Journey-F" }, // 한국어 음성
        audioConfig: { audioEncoding: "MP3" },
      };

      const [ttsResponse] = await client.synthesizeSpeech(ttsRequest);

      // 고유한 파일 이름 생성
      const timestamp = Date.now();
      const audioFilename = `AI[${timestamp}].mp3`;
      const audioFilePath = path.join(aiAudioDir, audioFilename);

      // 오디오 콘텐츠를 파일로 저장
      fs.writeFileSync(audioFilePath, ttsResponse.audioContent, "binary");

      // 오디오 콘텐츠를 base64로 인코딩
      const audioContent = ttsResponse.audioContent.toString("base64");

      return res.json({
        success: true,
        response: assistantResponseText,
        audioContent: audioContent,
        audioFile: audioFilename,
        thread_id: threadId,
      });
    } else {
      console.error("Assistant가 응답을 제공하지 않았습니다.");
      return res.status(500).json({
        success: false,
        error: "Assistant가 응답을 제공하지 않았습니다.",
      });
    }
  } catch (error) {
    console.error("=== handleChat 오류 ===");
    console.error("오류 타입:", error.constructor.name);
    console.error("오류 메시지:", error.message);
    console.error("오류 스택:", error.stack);

    // OpenAI API 관련 오류인 경우 임시 응답
    if (
      error.code === "ECONNRESET" ||
      error.type === "system" ||
      error.name === "APIConnectionError" ||
      error.message.includes("Connection error") ||
      error.message.includes("socket hang up") ||
      error.cause?.code === "ECONNRESET" ||
      error.code === "ECANCELED"
    ) {
      console.warn("OpenAI API 연결 오류. 임시 응답을 반환합니다.");
      return res.json({
        success: true,
        response:
          "죄송합니다. 현재 네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
        audioContent: null,
        audioFile: null,
        thread_id: req.body.thread_id || `temp_thread_${Date.now()}`,
      });
    }

    // 기타 OpenAI API 오류
    if (error.name === "APIError" || error.name === "APIConnectionError") {
      console.warn("OpenAI API 오류. 임시 응답을 반환합니다.");
      return res.json({
        success: true,
        response:
          "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
        audioContent: null,
        audioFile: null,
        thread_id: req.body.thread_id || `temp_thread_${Date.now()}`,
      });
    }

    return res.status(500).json({
      success: false,
      error: "오류 발생",
    });
  }
}

// AI 인터뷰 세션 시작
async function startInterviewSession(req, res) {
  try {
    const { userId, companyId, position, includeInitialQuestion } = req.body;

    console.log("=== AI 인터뷰 세션 시작 요청 ===");
    console.log("요청 시간:", new Date().toISOString());
    console.log("사용자 ID:", userId);
    console.log("회사 ID:", companyId);
    console.log("포지션:", position);
    console.log("초기 질문 포함:", includeInitialQuestion);
    console.log("요청 ID:", req.headers["x-request-id"] || "없음");
    console.log("=====================================");

    // OpenAI API 키가 설정되지 않은 경우 임시 응답
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "OpenAI API 키가 설정되지 않았습니다. 임시 응답을 반환합니다."
      );
      return res.json({
        success: true,
        thread_id: `temp_thread_${Date.now()}`,
        message: "AI 인터뷰 세션이 시작되었습니다. (임시 모드)",
        initialQuestion:
          "안녕하세요! 면접을 시작하겠습니다. 자기소개를 해주세요.",
        audioContent: null,
      });
    }

    // 새로운 스레드 생성
    const thread = await openai.beta.threads.create();

    let initialQuestion = null;
    let audioContent = null;

    // 초기 질문이 요청된 경우 생성
    if (includeInitialQuestion) {
      try {
        // 초기 메시지를 스레드에 추가
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: "안녕하세요. 면접을 시작해주세요.",
        });

        // 어시스턴트 실행
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: resolveAssistantId(companyId),
        });

        // 실행 완료 대기
        let runStatus = await openai.beta.threads.runs.retrieve(
          thread.id,
          run.id
        );
        while (
          runStatus.status === "in_progress" ||
          runStatus.status === "queued"
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
        }

        if (runStatus.status === "completed") {
          // 최신 메시지 가져오기
          const messages = await openai.beta.threads.messages.list(thread.id);
          const latestMessage = messages.data[0];

          if (
            latestMessage &&
            latestMessage.content &&
            latestMessage.content.length > 0
          ) {
            initialQuestion = latestMessage.content[0].text.value;

            // TTS로 음성 생성 (Google Cloud TTS가 설정된 경우)
            if (textToSpeech) {
              try {
                const client = new textToSpeech.TextToSpeechClient();
                const request = {
                  input: { text: initialQuestion },
                  voice: { languageCode: "ko-KR", ssmlGender: "NEUTRAL" },
                  audioConfig: { audioEncoding: "MP3" },
                };

                const [response] = await client.synthesizeSpeech(request);
                audioContent = Buffer.from(response.audioContent).toString(
                  "base64"
                );
              } catch (ttsError) {
                console.warn("TTS 생성 실패:", ttsError);
              }
            }
          }
        }
      } catch (questionError) {
        console.warn("초기 질문 생성 실패:", questionError);
        initialQuestion =
          "안녕하세요! 면접을 시작하겠습니다. 자기소개를 해주세요.";
      }
    }

    // 세션 정보를 데이터베이스에 저장 (필요시)
    // const session = await AIInterviewSession.create({
    //   userId,
    //   companyId,
    //   position,
    //   threadId: thread.id,
    //   status: 'active'
    // });

    res.json({
      success: true,
      thread_id: thread.id,
      message: "AI 인터뷰 세션이 시작되었습니다.",
      initialQuestion: initialQuestion,
      audioContent: audioContent,
    });
  } catch (error) {
    console.error("세션 시작 오류:", error);
    res.status(500).json({
      success: false,
      error: "세션 시작 중 오류가 발생했습니다.",
    });
  }
}

// AI 인터뷰 세션 종료
async function endInterviewSession(req, res) {
  try {
    const { threadId } = req.body;

    // 세션 상태 업데이트 (필요시)
    // await AIInterviewSession.updateStatus(threadId, 'completed');

    res.json({
      success: true,
      message: "AI 인터뷰 세션이 종료되었습니다.",
    });
  } catch (error) {
    console.error("세션 종료 오류:", error);
    res.status(500).json({
      success: false,
      error: "세션 종료 중 오류가 발생했습니다.",
    });
  }
}

// AI 면접 질문 생성 (5단계 프로세스)
async function generateQuestion(req, res) {
  try {
    console.log("=== AI 면접 질문 생성 시작 ===");

    const {
      task_type,
      company_id,
      question_text,
      transcription,
      thread_id,
      current_question_count = 0,
    } = req.body;

    // 사용자 정보 가져오기
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "사용자를 찾을 수 없습니다.",
      });
    }

    // 사용자의 자기소개서와 이력서 정보 가져오기 (최신 1건 사용)
    const selfIntroductions = await SelfIntroduction.findByUserId(userId);
    const resumes = await Resume.findByUserId(userId);
    const selfIntroductionId =
      Array.isArray(selfIntroductions) && selfIntroductions.length > 0
        ? selfIntroductions[0].id
        : null;
    const resumeId =
      Array.isArray(resumes) && resumes.length > 0 ? resumes[0].id : null;

    const userData = {
      task_type,
      company_id,
      question_text,
      transcription,
      self_introduction_id: selfIntroductionId,
      resume_id: resumeId,
      current_question_count,
    };

    console.log("질문 생성 데이터:", userData);

    // aiInterviewService의 generateQuestion 함수 호출
    const aiInterviewService = require("../services/aiInterviewService");
    const result = await aiInterviewService.generateQuestion(
      userData,
      thread_id
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    // TTS로 음성 생성 (Google Cloud TTS가 설정된 경우)
    let audioContent = null;
    if (textToSpeech && result.data.question_text) {
      try {
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
          input: { text: result.data.question_text },
          voice: { languageCode: "en-US", name: "en-US-Journey-F" },
          audioConfig: { audioEncoding: "MP3" },
        };

        const [response] = await client.synthesizeSpeech(request);
        audioContent = Buffer.from(response.audioContent).toString("base64");
      } catch (ttsError) {
        console.warn("TTS 생성 실패:", ttsError);
      }
    }

    console.log("=== AI 면접 질문 생성 완료 ===");
    console.log("생성된 질문:", result.data);

    res.json({
      success: true,
      data: result.data,
      thread_id: result.thread_id,
      audioContent: audioContent,
    });
  } catch (error) {
    console.error("질문 생성 오류:", error);
    res.status(500).json({
      success: false,
      error: "질문 생성 중 오류가 발생했습니다.",
    });
  }
}

module.exports = {
  transcribeAudio,
  handleChat,
  startInterviewSession,
  endInterviewSession,
  generateQuestion,
};
