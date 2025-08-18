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

// 기업별 Assistant ID 선택
function resolveAssistantId(companyId) {
  try {
    const mapByCode = {
      baemin: process.env.BAEMIN,
      coupang: process.env.COUPANG,
      naver: process.env.NAVER,
      kakao: process.env.KAKAO,
    };

    if (!companyId) {
      return process.env.ASSISTANT_ID || process.env.BAEMIN || assistantId;
    }

    if (typeof companyId === "string" && mapByCode[companyId]) {
      return mapByCode[companyId] || assistantId;
    }

    // 숫자/기타 ID인 경우 회사 이름으로 유추
    const nameToEnv = {
      "배달의 민족": process.env.BAEMIN,
      쿠팡: process.env.COUPANG,
      네이버: process.env.NAVER,
      카카오: process.env.KAKAO,
    };

    // 동기 접근이 아니므로 기본값 반환. 실제 조회는 호출부에서 company_name으로 처리됨
    return process.env.ASSISTANT_ID || assistantId;
  } catch (e) {
    return process.env.ASSISTANT_ID || assistantId;
  }
}

// 기업 정보 가져오기
async function getCompanyInfo(companyId) {
  try {
    if (!companyId || companyId === "일반") {
      return "일반 기업";
    }

    // 문자열 코드 매핑(프론트 고정 셋)
    const codeToNameMap = {
      baemin: "배달의 민족",
      coupang: "쿠팡",
      naver: "네이버",
      kakao: "카카오",
    };
    if (typeof companyId === "string" && codeToNameMap[companyId]) {
      return codeToNameMap[companyId];
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
async function sendMessageToAssistant(
  message,
  threadId = null,
  companyId = null
) {
  try {
    // OpenAI API가 설정되지 않은 경우
    if (!openai || !assistantId) {
      return {
        success: false,
        error: "OpenAI API가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
      };
    }

    let currentThreadId = threadId;
    const assistantIdToUse = resolveAssistantId(companyId);

    if (!currentThreadId) {
      // 새로운 스레드 생성
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // 메시지 생성
    const instruction = `응답은 반드시 JSON만 출력하세요. 불필요한 설명이나 문장은 포함하지 마세요.`;
    const composed = `${instruction}\n\n${message}`;
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: composed,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
      assistant_id: assistantIdToUse,
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

function safeParseAssistantResponse(raw, defaultType) {
  try {
    let text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return null;
    if (text.startsWith("```")) {
      const firstNl = text.indexOf("\n");
      if (firstNl !== -1) text = text.slice(firstNl + 1);
      if (text.endsWith("```")) text = text.slice(0, -3).trim();
    }
    return JSON.parse(text);
  } catch (e) {
    return {
      question_text: String(raw || ""),
      question_type: defaultType || "기타",
    };
  }
}

// 작업 0: 자기소개 요청 (무조건 첫 단계)
async function requestSelfIntroduction(userData) {
  try {
    console.log("자기소개 요청 시작:", { userData });

    // OpenAI API가 설정되지 않은 경우 기본 질문 반환
    if (!openai || !assistantId) {
      console.log("OpenAI API가 설정되지 않음. 기본 자기소개 요청 사용");
      return {
        success: true,
        data: {
          question_text:
            "면접을 시작하겠습니다. 먼저, 본인에 대해 간단히 소개해 주시겠어요?",
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

    const userPrompt = `

작업 0(자기소개 요청)을 위한 입력:
{
  "task_type": "self_introduction_request",
  "company_id": "${companyName}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}"
}`;

    console.log("Assistant에 자기소개 요청 메시지 전송 시작");
    const result = await sendMessageToAssistant(userPrompt, null, company_id);

    if (!result.success) {
      console.error("Assistant 응답 실패:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log("Assistant 응답 받음:", result.response);

    // JSON 파싱 (유연하게 처리)
    const parsed = safeParseAssistantResponse(result.response, "인성");
    return {
      success: true,
      data: { ...parsed, is_follow_up: false },
      thread_id: result.thread_id,
    };
  } catch (error) {
    console.error("자기소개 요청 오류:", error);
    return {
      success: false,
      error: `자기소개 요청 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

// 작업 1: 초기 면접 질문 생성
async function generateInitialQuestion(userData, threadId = null) {
  try {
    console.log("초기 질문 생성 시작:", { userData });

    // OpenAI API가 설정되지 않은 경우 기본 질문 반환
    if (!openai || !assistantId) {
      console.log("OpenAI API가 설정되지 않음. 기본 질문 사용");
      return {
        success: true,
        data: {
          question_text:
            "귀하의 데이터 분석 경험 중 가장 도전적이었던 프로젝트는 무엇이었고, 이를 어떻게 해결하셨나요?",
          question_type: "경험",
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

    const userPrompt = `

작업 1(초기 면접 질문 생성)을 위한 입력:
{
  "task_type": "initial_question",
  "company_id": "${companyName}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}"
}`;

    console.log("Assistant에 메시지 전송 시작");
    const result = await sendMessageToAssistant(
      userPrompt,
      threadId,
      company_id
    );

    if (!result.success) {
      console.error("Assistant 응답 실패:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log("Assistant 응답 받음:", result.response);

    // JSON 파싱 (유연하게 처리)
    const parsed = safeParseAssistantResponse(result.response, "경험");
    return {
      success: true,
      data: { ...parsed, is_follow_up: false },
      thread_id: result.thread_id,
    };
  } catch (error) {
    console.error("초기 질문 생성 오류:", error);
    return {
      success: false,
      error: `질문 생성 중 오류가 발생했습니다: ${error.message}`,
    };
  }
}

// 작업 2: 심화/꼬리 질문 생성
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

    const userPrompt = `

작업 2(심화/꼬리 질문 생성)을 위한 입력:
{
  "task_type": "follow_up_question",
  "company_id": "${companyName}",
  "question_text": "${question_text.replace(/"/g, '\\"')}",
  "transcription": "${transcription.replace(/"/g, '\\"')}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}"
}`;

    const result = await sendMessageToAssistant(
      userPrompt,
      threadId,
      company_id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    const parsed = safeParseAssistantResponse(result.response, "기타");
    return {
      success: true,
      data: { ...parsed, is_follow_up: true },
      thread_id: result.thread_id,
    };
  } catch (error) {
    console.error("심화 질문 생성 오류:", error);
    return {
      success: false,
      error: "심화 질문 생성 중 오류가 발생했습니다.",
    };
  }
}

// 작업 3: 다음 기본 면접 질문으로 전환
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

    const userPrompt = `

작업 3(다음 기본 질문 생성)을 위한 입력:
{
  "task_type": "next_question",
  "company_id": "${companyName}",
  "question_text": "${question_text.replace(/"/g, '\\"')}",
  "transcription": "${transcription.replace(/"/g, '\\"')}",
  "self_introduction": "${selfIntroduction.replace(/"/g, '\\"')}",
  "resume": "${resume.replace(/"/g, '\\"')}",
  "current_question_count": ${current_question_count}
}`;

    const result = await sendMessageToAssistant(
      userPrompt,
      threadId,
      company_id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    const parsed = safeParseAssistantResponse(result.response, "기타");
    return {
      success: true,
      data: { ...parsed, is_follow_up: false },
      thread_id: result.thread_id,
    };
  } catch (error) {
    console.error("다음 질문 생성 오류:", error);
    return {
      success: false,
      error: "다음 질문 생성 중 오류가 발생했습니다.",
    };
  }
}

// 작업 4: 면접 종료 조건 감지
async function checkInterviewEndCondition(userData, threadId = null) {
  try {
    const {
      company_id,
      question_text,
      transcription,
      self_introduction_id,
      resume_id,
    } = userData;

    // 종료 키워드 감지
    const endKeywords = [
      "마지막으로",
      "끝으로",
      "마지막 질문입니다",
      "이것으로",
      "면접을 마치겠습니다",
    ];
    const hasEndKeyword = endKeywords.some(
      (keyword) =>
        transcription.includes(keyword) || question_text.includes(keyword)
    );

    if (hasEndKeyword) {
      return {
        success: true,
        data: {
          question_text:
            "면접에 응해 주셔서 감사합니다. 오늘 말씀해 주신 내용을 바탕으로 추후 결과를 안내드리겠습니다.",
          question_type: "기타",
          is_end: true,
        },
        thread_id: threadId,
      };
    }

    return {
      success: true,
      data: {
        is_end: false,
      },
      thread_id: threadId,
    };
  } catch (error) {
    console.error("면접 종료 조건 확인 오류:", error);
    return {
      success: false,
      error: "면접 종료 조건 확인 중 오류가 발생했습니다.",
    };
  }
}

// 통합 질문 생성 함수 (5단계 프로세스)
async function generateQuestion(userData, threadId = null) {
  try {
    const {
      task_type,
      company_id,
      question_text,
      transcription,
      self_introduction_id,
      resume_id,
      current_question_count = 0,
      follow_up_count = 0,
    } = userData;

    console.log("질문 생성 시작:", { task_type, current_question_count });

    // 면접 총 질문 수 제한
    const MAX_TOTAL_QUESTIONS = 15; // 총 15개
    const nextQuestionIndex = current_question_count + 1; // 다음 질문 번호(1-base)

    // 15번째는 무조건 마지막 질문
    if (nextQuestionIndex >= MAX_TOTAL_QUESTIONS) {
      return {
        success: true,
        data: {
          question_text:
            "마지막 질문입니다. 오늘 면접에서 스스로 가장 잘했다고 생각하는 점과 개선하고 싶은 점을 한 가지씩 말씀해 주세요.",
          question_type: "마무리",
          is_end: true,
        },
        thread_id: threadId,
      };
    }

    // 작업 0: 자기소개 요청 (첫 번째 질문)
    if (task_type === "self_introduction_request") {
      return await requestSelfIntroduction(userData);
    }

    // 작업 4: 면접 종료 조건 감지
    const endCheck = await checkInterviewEndCondition(userData, threadId);
    if (endCheck.success && endCheck.data.is_end) {
      return endCheck;
    }

    // 작업 1: 초기 면접 질문 생성 (자기소개 후 첫 번째 질문)
    if (task_type === "initial_question" || current_question_count === 1) {
      return await generateInitialQuestion(userData, threadId);
    }

    // 작업 2: 심화/꼬리 질문 생성 (답변이 간결하거나 모호한 경우)
    const MAX_FOLLOW_UPS = 1; // 고정: 꼬리질문 최대 2회
    const MIN_LENGTH_FOR_DETAILED = Number(
      process.env.MIN_TRANSCRIPT_LEN || 100
    );
    const isShortAnswer = !!(
      transcription && transcription.length < MIN_LENGTH_FOR_DETAILED
    );
    const remainingSlots = MAX_TOTAL_QUESTIONS - nextQuestionIndex;
    const canAskFollowUp =
      remainingSlots > 1 && follow_up_count < MAX_FOLLOW_UPS;
    const shouldFollowUp =
      task_type === "follow_up_question" || (isShortAnswer && canAskFollowUp);

    if (shouldFollowUp) {
      const nextUserData = {
        ...userData,
        follow_up_count: follow_up_count + 1,
      };
      return await generateFollowUpQuestion(nextUserData, threadId);
    }

    // 작업 3: 다음 기본 면접 질문으로 전환
    return await generateNextQuestion(userData, threadId);
  } catch (error) {
    console.error("통합 질문 생성 오류:", error);
    return {
      success: false,
      error: `질문 생성 중 오류가 발생했습니다: ${error.message}`,
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

    const result = await sendMessageToAssistant(userPrompt, null, company_id);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    const parsed = safeParseAssistantResponse(result.response, "기타");
    return {
      success: true,
      data: parsed,
      thread_id: result.thread_id,
    };
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
  generateQuestion,
  requestSelfIntroduction,
  generateInitialQuestion,
  generateFollowUpQuestion,
  generateNextQuestion,
  checkInterviewEndCondition,
  generateInterviewFeedback,
};
