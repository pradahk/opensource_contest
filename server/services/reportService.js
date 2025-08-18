const dotenv = require("dotenv");
const crypto = require("crypto");
const Report = require("../models/Report");
const InterviewSession = require("../models/InterviewSession");
const UserAnswer = require("../models/UserAnswer");
const User = require("../models/User");
const SelfIntroduction = require("../models/SelfIntroduction");
const Resume = require("../models/Resume");
const voiceAnalysisService = require("./voiceAnalysisService");

let openai = null;
try {
  dotenv.config({ path: ".env" });
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

async function generateFinalMarkdownForSession(sessionId, userId) {
  // 세션 확인
  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  // 누락된 음성 분석 수행 (가능하면)
  try {
    await voiceAnalysisService.analyzeAllAnswersInSession(sessionId);
  } catch (e) {
    console.warn("세션 음성 분석 중 경고:", e.message);
  }

  // 답변+분석 조회 및 프롬프트 입력 데이터 구성
  const answersWithAnalysis = await UserAnswer.getSessionAnswersWithAnalysis(
    sessionId
  );
  const interview_data_log = (answersWithAnalysis || []).map((row) => ({
    question_text: row.question_text || "",
    transcription: row.transcription || "",
    sense_voice_analysis: {
      pronunciation_score:
        typeof row.pronunciation_score === "number"
          ? row.pronunciation_score
          : undefined,
      emotion: row.emotion || undefined,
      speed_wpm: typeof row.speed_wpm === "number" ? row.speed_wpm : undefined,
      filler_count:
        typeof row.filler_count === "number" ? row.filler_count : undefined,
      pitch_variation:
        typeof row.pitch_variation === "number"
          ? row.pitch_variation
          : undefined,
    },
  }));

  if (!Array.isArray(interview_data_log) || interview_data_log.length === 0) {
    throw new Error("세션에 입력 데이터가 없습니다.");
  }

  // user_info 구성
  const user = await User.findById(session.user_id);
  const sis = await SelfIntroduction.findByUserId(session.user_id);
  const resumes = await Resume.findByUserId(session.user_id);
  const user_info = {
    name: user?.nickname || session.user_nickname || "지원자",
    self_introduction:
      Array.isArray(sis) && sis.length > 0 ? sis[0]?.content || "" : "",
    resumes:
      Array.isArray(resumes) && resumes.length > 0
        ? resumes[0]?.content || ""
        : "",
  };

  // 통계 및 총점
  const totalQuestions = interview_data_log.length;
  const pronScores = interview_data_log
    .map((i) => i?.sense_voice_analysis?.pronunciation_score)
    .filter((n) => typeof n === "number");
  const avgPron = pronScores.length
    ? pronScores.reduce((a, b) => a + b, 0) / pronScores.length
    : 0.85;
  const avgSpeed =
    interview_data_log
      .map((i) => i?.sense_voice_analysis?.speed_wpm)
      .filter((n) => typeof n === "number")
      .reduce((a, b) => a + b, 0) /
      (interview_data_log.filter(
        (i) => typeof i?.sense_voice_analysis?.speed_wpm === "number"
      ).length || 1) || 0;
  const avgFiller =
    interview_data_log
      .map((i) => i?.sense_voice_analysis?.filler_count)
      .filter((n) => typeof n === "number")
      .reduce((a, b) => a + b, 0) /
      (interview_data_log.filter(
        (i) => typeof i?.sense_voice_analysis?.filler_count === "number"
      ).length || 1) || 0;

  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        avgPron * 100 * 0.6 +
          (100 - Math.min(100, avgFiller * 10)) * 0.2 +
          Math.max(0, 100 - Math.abs(180 - avgSpeed)) * 0.2
      )
    )
  );

  // OpenAI 마크다운 생성 (가능 시)
  let markdown = null;
  if (openai) {
    const role = `당신은 AI 기반의 전문 커리어 코치이자 데이터 분석가입니다. 제공된 interview_data_log를 심층 분석하여, 엄격한 출력 규칙에 따라 전문적이고 가독성 높은 최종 분석 보고서를 순수 마크다운 형식으로 작성하세요.`;
    const rules = `출력 규칙:\n- 순수 마크다운(GFM)만 사용. HTML 태그 금지\n- 불필요한 텍스트, placeholder 금지\n- 테이블 행은 모두 파이프로 시작/끝, 헤더-본문 컬럼 수 일치\n- 예시 문구/수치 복사 금지. 입력 데이터 기반으로 새로 작성`;
    const instruction = `다음 4단계 프로세스로 작성:\n1) 데이터 종합 분석\n2) 핵심 평가 지표 생성(종합 점수, 강점, 개선점: 수치 근거)\n3) 섹션별 초안 작성\n4) 최종 마크다운 보고서 생성`;
    const inputJson = JSON.stringify({ user_info, interview_data_log });
    const finalDirective = `반드시 마크다운만 출력. 설명 문장 없이 최종 보고서만 답변.`;
    const prompt = `${role}\n\n${instruction}\n\n${rules}\n\n입력 데이터(JSON):\n${inputJson}\n\n${finalDirective}`;
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: role },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });
      markdown = completion.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.warn("OpenAI 보고서 생성 실패, fallback 사용:", err.message);
    }
  }

  if (!markdown) {
    const name = user_info?.name || "지원자";
    const tableRows = interview_data_log
      .map((item, idx) => {
        const v = item.sense_voice_analysis || {};
        return `| ${idx + 1} | ${item.question_text || ""} | ${
          v.emotion || ""
        } | ${
          typeof v.pronunciation_score === "number"
            ? v.pronunciation_score.toFixed(2)
            : ""
        } | ${typeof v.speed_wpm === "number" ? v.speed_wpm : ""} | ${
          typeof v.filler_count === "number" ? v.filler_count : ""
        } | ${
          typeof v.pitch_variation === "number" ? v.pitch_variation : ""
        } |`;
      })
      .join("\n");

    markdown = `# ${name} 님을 위한 AI 면접 최종 분석 리포트\n\n안녕하세요, ${name} 님. 전체 면접 분석 리포트입니다.\n총 ${totalQuestions}개의 문항으로 진행된 모의 면접 전체 과정을 분석한 결과를 공유해 드립니다.\n\n---\n\n## Ⅰ. 종합 평가\n\n**종합 점수: ${overall} / 100점**\n\n> 답변 명료성과 말하기 속도, 간투사 빈도를 종합적으로 평가했습니다.\n\n### **핵심 강점 (Strengths)**\n\n* **🏆 발음 안정성**: 평균 발음 점수가 ${(
      avgPron * 100
    ).toFixed(
      0
    )}점 수준으로 일관성이 확인됩니다.\n* **👍 속도 조절**: 평균 WPM이 ${avgSpeed.toFixed(
      0
    )}로 과도한 속도 편차가 크지 않습니다.\n\n### **개선 제안 (Areas for Improvement)**\n\n* **🏃‍♂️ 간투사 감소**: 평균 간투사 빈도 ${avgFiller.toFixed(
      1
    )}회로, 핵심 메시지 전 전달에 유의하세요.\n* **🗣️ 억양 다양화**: 피치 변화 지표가 낮은 구간에서 의도적인 강조를 연습해 보세요.\n\n---\n\n## Ⅱ. 상세 분석 데이터\n\n### **질문별 음성 분석 결과**\n\n| 질문 번호 | 질문 내용 | 주요 감정 | 발음 정확도 | 속도 (WPM) | 간투사 | 음높이 변화 |\n| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n${tableRows}\n\n---\n\n## Ⅲ. 맞춤형 솔루션\n\n${name} 님의 성공적인 면접을 위해 다음 두 가지를 제안합니다.\n\n**1. 간투사 최소화 훈련 루틴**\n\n주 3회, 5분 스크립트 리딩 후 즉석 요약을 녹음하며 ‘음/어/그’ 체크리스트로 카운트 감축을 트래킹하세요.\n\n**2. WPM 타겟 설정과 문장 호흡**\n\n목표 WPM을 160~180으로 설정하고 문장 끝마다 0.5초 호흡 정지 습관을 적용해 속도와 명료도를 동시에 개선하세요.`;
  }

  // 저장
  const contentHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(interview_data_log))
    .digest("hex");

  const payloadJson = {
    markdown,
    user_info,
    interview_data_log,
    stats: {
      total_questions: totalQuestions,
      avg_pronunciation: avgPron,
      avg_speed_wpm: avgSpeed,
      avg_filler_count: avgFiller,
      overall_score: overall,
    },
    model: process.env.OPENAI_MODEL || (openai ? "gpt-4o-mini" : "fallback"),
    content_hash: contentHash,
  };

  const existing = await Report.findBySessionId(sessionId);
  let reportId;

  const safeOverall = Number.isFinite(overall) ? overall : 0;
  const savedScore = Math.max(0, Math.min(100, Math.round(safeOverall)));

  const trySave = async (scoreValue) => {
    if (existing) {
      await Report.update(existing.id, {
        total_score: scoreValue,
        strengths: existing.strengths || null,
        weaknesses: existing.weaknesses || null,
        suggestions: existing.suggestions || null,
        report_json: payloadJson,
      });
      return existing.id;
    } else {
      return await Report.create({
        session_id: sessionId,
        total_score: scoreValue,
        strengths: null,
        weaknesses: null,
        suggestions: null,
        report_json: payloadJson,
      });
    }
  };

  if (existing) {
    let existingJson = null;
    try {
      existingJson = existing.report_json
        ? JSON.parse(existing.report_json)
        : null;
    } catch (_) {}
    if (existingJson && existingJson.content_hash === contentHash) {
      return {
        markdown,
        report_id: existing.id,
        session_id: sessionId,
        saved: true,
        deduped: true,
      };
    }
  }

  try {
    reportId = await trySave(savedScore);
  } catch (e1) {
    const normalizedScore = Math.min(0.99, Math.max(0, safeOverall / 100));
    reportId = await trySave(normalizedScore);
  }

  return { markdown, report_id: reportId, session_id: sessionId, saved: true };
}

module.exports = {
  generateFinalMarkdownForSession,
};
