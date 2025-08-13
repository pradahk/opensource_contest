const OpenAI = require("openai");
const dotenv = require("dotenv");
const Company = require("../models/Company");
const SelfIntroduction = require("../models/SelfIntroduction");
const Resume = require("../models/Resume");

// .env 파일에서 환경 변수 로드
dotenv.config({
  path: ".env",
});

// OpenAI API 키 확인
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY가 설정되지 않았습니다. 기본 질문을 사용합니다.");
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI(process.env.OPENAI_API_KEY)
  : null;

// Assistant ID 설정
const assistantId = process.env.BAEMIN || process.env.ASSISTANT_ID;

if (!assistantId) {
  console.warn("ASSISTANT_ID가 설정되지 않았습니다. 기본 질문을 사용합니다.");
}

// 기업 정보 가져오기
async function getCompanyInfo(companyId) {
  try {
    if (!companyId || companyId === "일반") {
      return "일반 기업";
    }

    const company = await Company.findById(companyId);
    return company ? company.name : "일반 기업";
  } catch (error) {
    console.error("기업 정보 조회 오류:", error);
    return "일반 기업";
  }
}

// 자기소개서 정보 가져오기
async function getSelfIntroductionInfo(selfIntroductionId) {
  try {
    if (!selfIntroductionId) {
      return "자기소개서 정보가 없습니다.";
    }

    const selfIntroduction = await SelfIntroduction.findById(
      selfIntroductionId
    );
    return selfIntroduction
      ? selfIntroduction.content
      : "자기소개서 정보가 없습니다.";
  } catch (error) {
    console.error("자기소개서 정보 조회 오류:", error);
    return "자기소개서 정보를 가져올 수 없습니다.";
  }
}

// 이력서 정보 가져오기
async function getResumeInfo(resumeId) {
  try {
    if (!resumeId) {
      return "이력서 정보가 없습니다.";
    }

    const resume = await Resume.findById(resumeId);
    return resume ? resume.content : "이력서 정보가 없습니다.";
  } catch (error) {
    console.error("이력서 정보 조회 오류:", error);
    return "이력서 정보를 가져올 수 없습니다.";
  }
}

// Assistant API를 통해 메시지 전송 및 응답 받기
async function sendMessageToAssistant(message, threadId = null) {
  try {
    // OpenAI API가 설정되지 않은 경우
    if (!openai || !assistantId) {
      return {
        success: false,
        error: "OpenAI API가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
      };
    }

    let currentThreadId = threadId;

    if (!currentThreadId) {
      // 새로운 스레드 생성
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // 메시지 생성
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return {
        success: false,
        error: `Assistant 실행 실패: ${run.status}`,
        status: run.status,
      };
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(currentThreadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;
      return {
        success: true,
        response: assistantResponseText,
        thread_id: currentThreadId,
      };
    } else {
      return {
        success: false,
        error: "Assistant가 응답을 제공하지 않았습니다.",
      };
    }
  } catch (error) {
    console.error("Assistant 메시지 전송 오류:", error);
    return {
      success: false,
      error: `메시지 전송 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

// 초기 면접 질문 생성
async function generateInitialQuestion(userData) {
  try {
    console.log("초기 질문 생성 시작:", { userData });

    // OpenAI API가 설정되지 않은 경우 기본 질문 반환
    if (!openai || !assistantId) {
      console.log("OpenAI API가 설정되지 않음. 기본 질문 사용");
      return {
        success: true,
        data: {
          question_text: "자기소개를 해주세요.",
          question_type: "인성",
        },
        thread_id: null,
      };
    }

    const { company_id, self_introduction_id, resume_id } = userData;

    // 실제 데이터 가져오기
    const companyName = await getCompanyInfo(company_id);
    const selfIntroduction = await getSelfIntroductionInfo(
      self_introduction_id
    );
    const resume = await getResumeInfo(resume_id);

    console.log("데이터 조회 완료:", {
      companyName,
      selfIntroductionLength: selfIntroduction.length,
      resumeLength: resume.length,
    });

    const userPrompt = `작업 1(초기 질문 생성)을 위한 입력:
{
  "task_type": "initial_question",
  "company_name": "${companyName}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}"
}`;

    console.log("Assistant에 메시지 전송 시작");
    const result = await sendMessageToAssistant(userPrompt);

    if (!result.success) {
      console.error("Assistant 응답 실패:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log("Assistant 응답 받음:", result.response);

    // JSON 파싱
    try {
      const parsedResponse = JSON.parse(result.response);
      console.log("JSON 파싱 성공:", parsedResponse);
      return {
        success: true,
        data: parsedResponse,
        thread_id: result.thread_id,
      };
    } catch (parseError) {
      console.error(
        "JSON 파싱 오류:",
        parseError,
        "원본 응답:",
        result.response
      );
      return {
        success: false,
        error: "응답 파싱에 실패했습니다.",
      };
    }
  } catch (error) {
    console.error("초기 질문 생성 오류:", error);
    return {
      success: false,
      error: `질문 생성 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

// 심화/꼬리 질문 생성
async function generateFollowUpQuestion(userData, threadId = null) {
  try {
    const {
      company_id,
      question_text,
      transcription,
      self_introduction_id,
      resume_id,
    } = userData;

    // 실제 데이터 가져오기
    const companyName = await getCompanyInfo(company_id);
    const selfIntroduction = await getSelfIntroductionInfo(
      self_introduction_id
    );
    const resume = await getResumeInfo(resume_id);

    const userPrompt = `작업 2(심화/꼬리 질문 생성)을 위한 입력:
{
  "task_type": "follow_up_question",
  "company_name": "${companyName}",
  "question_text": "${question_text.replace(/"/g, '\\"')}",
  "transcription": "${transcription.replace(/"/g, '\\"')}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}"
}`;

    const result = await sendMessageToAssistant(userPrompt, threadId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    try {
      const parsedResponse = JSON.parse(result.response);
      return {
        success: true,
        data: parsedResponse,
        thread_id: result.thread_id,
      };
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      return {
        success: false,
        error: "응답 파싱에 실패했습니다.",
      };
    }
  } catch (error) {
    console.error("심화 질문 생성 오류:", error);
    return {
      success: false,
      error: "심화 질문 생성 중 오류가 발생했습니다.",
    };
  }
}

// 다음 기본 면접 질문으로 전환
async function generateNextQuestion(userData, threadId = null) {
  try {
    const {
      company_id,
      question_text,
      transcription,
      self_introduction_id,
      resume_id,
      current_question_count,
    } = userData;

    // 실제 데이터 가져오기
    const companyName = await getCompanyInfo(company_id);
    const selfIntroduction = await getSelfIntroductionInfo(
      self_introduction_id
    );
    const resume = await getResumeInfo(resume_id);

    const userPrompt = `작업 3(다음 기본 질문 생성)을 위한 입력:
{
  "task_type": "next_question",
  "company_name": "${companyName}",
  "question_text": "${question_text.replace(/"/g, '\\"')}",
  "transcription": "${transcription.replace(/"/g, '\\"')}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}",
  "current_question_count": ${current_question_count}
}`;

    const result = await sendMessageToAssistant(userPrompt, threadId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    try {
      const parsedResponse = JSON.parse(result.response);
      return {
        success: true,
        data: parsedResponse,
        thread_id: result.thread_id,
      };
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      return {
        success: false,
        error: "응답 파싱에 실패했습니다.",
      };
    }
  } catch (error) {
    console.error("다음 질문 생성 오류:", error);
    return {
      success: false,
      error: "다음 질문 생성 중 오류가 발생했습니다.",
    };
  }
}

// 면접 피드백 생성
async function generateInterviewFeedback(sessionData) {
  try {
    const { questions, answers, self_introduction_id, resume_id, company_id } =
      sessionData;

    // 실제 데이터 가져오기
    const companyName = await getCompanyInfo(company_id);
    const selfIntroduction = await getSelfIntroductionInfo(
      self_introduction_id
    );
    const resume = await getResumeInfo(resume_id);

    const userPrompt = `면접 세션 데이터:
- 기업: ${companyName}
- 자기소개서: ${selfIntroduction.replace(/"/g, '\\"')}
- 이력서: ${resume.replace(/"/g, '\\"')}
- 질문 및 답변: ${JSON.stringify(
      questions.map((q, i) => ({
        question: q.question_text,
        answer: answers[i]?.transcription || "답변 없음",
      }))
    )}`;

    const result = await sendMessageToAssistant(userPrompt);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    try {
      const parsedResponse = JSON.parse(result.response);
      return {
        success: true,
        data: parsedResponse,
        thread_id: result.thread_id,
      };
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      return {
        success: false,
        error: "응답 파싱에 실패했습니다.",
      };
    }
  } catch (error) {
    console.error("피드백 생성 오류:", error);
    return {
      success: false,
      error: "피드백 생성 중 오류가 발생했습니다.",
    };
  }
}

// OpenAI Assistant를 사용한 대화 처리 (기존 코드와 호환)
async function handleChat(req, res) {
  try {
    const userQuestion = req.body.message;
    let threadId = req.body.thread_id;

    if (!threadId) {
      // 새로운 스레드 생성
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // 메시지 생성
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userQuestion,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res
        .status(500)
        .json({ error: "Assistant 실행 실패", status: run.status });
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;
      return res.send({
        response: assistantResponseText,
        thread_id: threadId,
      });
    } else {
      return res
        .status(500)
        .json({ error: "Assistant가 응답을 제공하지 않았습니다." });
    }
  } catch (error) {
    console.error("챗봇 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

module.exports = {
  handleChat,
  generateInitialQuestion,
  generateFollowUpQuestion,
  generateNextQuestion,
  generateInterviewFeedback,
};
