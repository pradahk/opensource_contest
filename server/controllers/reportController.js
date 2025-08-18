const Report = require("../models/Report");
const InterviewSession = require("../models/InterviewSession");
const UserAnswer = require("../models/UserAnswer");
const VoiceAnalysis = require("../models/VoiceAnalysis");
const dotenv = require("dotenv");

let openai = null;
try {
  dotenv.config({ path: ".env" });
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

// 사용자의 모든 보고서 조회
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reports = await Report.findByUserId(userId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 특정 보고서 조회
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    // 사용자 권한 확인
    if (report.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "이 보고서에 접근할 권한이 없습니다.",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 세션별 보고서 조회
exports.getReportBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = await Report.findBySessionId(sessionId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "해당 세션의 보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("세션별 보고서 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 조회 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 생성
exports.createReport = async (req, res) => {
  try {
    const {
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json,
    } = req.body;

    if (!session_id || total_score === undefined) {
      return res.status(400).json({
        success: false,
        message: "세션 ID와 총점은 필수입니다.",
      });
    }

    // 세션 존재 확인
    const session = await InterviewSession.findById(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "세션을 찾을 수 없습니다.",
      });
    }

    // 이미 보고서가 있는지 확인
    const existingReport = await Report.findBySessionId(session_id);
    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: "이미 해당 세션의 보고서가 존재합니다.",
      });
    }

    const reportId = await Report.create({
      session_id,
      total_score,
      strengths,
      weaknesses,
      suggestions,
      report_json,
    });

    res.status(201).json({
      success: true,
      message: "보고서가 성공적으로 생성되었습니다.",
      data: { id: reportId },
    });
  } catch (error) {
    console.error("보고서 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 생성 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 수정
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const success = await Report.update(id, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "보고서가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("보고서 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 수정 중 오류가 발생했습니다.",
    });
  }
};

// 보고서 삭제
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await Report.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "보고서를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "보고서가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("보고서 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "보고서 삭제 중 오류가 발생했습니다.",
    });
  }
};

// 사용자 통계 조회
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await Report.getStatsByUser(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("사용자 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    });
  }
};

// AI 면접 최종 마크다운 보고서 생성 (옵션: DB 저장)
exports.generateAIReportMarkdown = async (req, res) => {
  try {
    const {
      user_info,
      interview_data_log,
      session_id: providedSessionId,
    } = req.body || {};

    if (!Array.isArray(interview_data_log) || interview_data_log.length === 0) {
      return res.status(400).json({
        success: false,
        message: "interview_data_log가 비어 있습니다.",
      });
    }

    // 간단한 통계 계산 (백업용)
    const totalQuestions = interview_data_log.length;
    const pronScores = interview_data_log
      .map((i) => i?.sense_voice_analysis?.pronunciation_score)
      .filter((n) => typeof n === "number");
    const avgPron = pronScores.length
      ? pronScores.reduce((a, b) => a + b, 0) / pronScores.length
      : 0.85; // 데이터는 있으나 점수가 없을 때 기본값
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

    const fallbackMarkdown = () => {
      const name = user_info?.name || "지원자";
      // 표 생성
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

      return `# ${name} 님을 위한 AI 면접 최종 분석 리포트

안녕하세요, ${name} 님. 전체 면접 분석 리포트입니다.
총 ${totalQuestions}개의 문항으로 진행된 모의 면접 전체 과정을 분석한 결과를 공유해 드립니다.

---

## Ⅰ. 종합 평가

**종합 점수: ${overall} / 100점**

> 답변 명료성과 말하기 속도, 간투사 빈도를 종합적으로 평가했습니다.

### **핵심 강점 (Strengths)**

* **🏆 발음 안정성**: 평균 발음 점수가 ${(avgPron * 100).toFixed(
        0
      )}점 수준으로 일관성이 확인됩니다.
* **👍 속도 조절**: 평균 WPM이 ${avgSpeed.toFixed(
        0
      )}로 과도한 속도 편차가 크지 않습니다.

### **개선 제안 (Areas for Improvement)**

* **🏃‍♂️ 간투사 감소**: 평균 간투사 빈도 ${avgFiller.toFixed(
        1
      )}회로, 핵심 메시지 전 전달에 유의하세요.
* **🗣️ 억양 다양화**: 피치 변화 지표가 낮은 구간에서 의도적인 강조를 연습해 보세요.

---

## Ⅱ. 상세 분석 데이터

### **질문별 음성 분석 결과**

| 질문 번호 | 질문 내용 | 주요 감정 | 발음 정확도 | 속도 (WPM) | 간투사 | 음높이 변화 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
${tableRows}

---

## Ⅲ. 맞춤형 솔루션

${name} 님의 성공적인 면접을 위해 다음 두 가지를 제안합니다.

**1. 간투사 최소화 훈련 루틴**

주 3회, 5분 스크립트 리딩 후 즉석 요약을 녹음하며 ‘음/어/그’ 체크리스트로 카운트 감축을 트래킹하세요.

**2. WPM 타겟 설정과 문장 호흡**

목표 WPM을 160~180으로 설정하고 문장 끝마다 0.5초 호흡 정지 습관을 적용해 속도와 명료도를 동시에 개선하세요.`;
    };

    // OpenAI 사용 시 프롬프트 조립
    let markdown = null;
    if (openai) {
      const role = `당신은 AI 기반의 전문 커리어 코치이자 데이터 분석가입니다. 제공된 interview_data_log를 심층 분석하여, 엄격한 출력 규칙에 따라 전문적이고 가독성 높은 최종 분석 보고서를 순수 마크다운 형식으로 작성하세요.`;
      const rules = `출력 규칙:
- 순수 마크다운(GFM)만 사용. HTML 태그 금지
- 불필요한 텍스트, placeholder 금지
- 테이블 행은 모두 파이프로 시작/끝, 헤더-본문 컬럼 수 일치
- 예시 문구/수치 복사 금지. 입력 데이터 기반으로 새로 작성`;
      const instruction = `다음 4단계 프로세스로 작성:
1) 데이터 종합 분석
2) 핵심 평가 지표 생성(종합 점수, 강점, 개선점: 수치 근거)
3) 섹션별 초안 작성
4) 최종 마크다운 보고서 생성`;

      const inputJson = JSON.stringify({ user_info, interview_data_log });
      const finalDirective = `반드시 마크다운만 출력. 설명 문장 없이 최종 보고서만 답변.`;

      const prompt = `${role}

${instruction}

${rules}

입력 데이터(JSON):
${inputJson}

${finalDirective}`;

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
      markdown = fallbackMarkdown();
    }

    // DB 저장 로직 (session_id가 없으면 최소 세션 생성)
    let finalSessionId = providedSessionId;
    try {
      if (!finalSessionId) {
        const newSession = await InterviewSession.create({
          user_id: req.user.userId,
          company_id: null,
        });
        finalSessionId = newSession.id;
      } else {
        const session = await InterviewSession.findById(finalSessionId);
        if (!session) {
          // 존재하지 않으면 새로 생성
          const newSession = await InterviewSession.create({
            user_id: req.user.userId,
            company_id: null,
          });
          finalSessionId = newSession.id;
        }
      }

      // 총점 산출 (fallback 계산 이용)
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
        model:
          process.env.OPENAI_MODEL || (openai ? "gpt-4o-mini" : "fallback"),
      };

      const existing = await Report.findBySessionId(finalSessionId);
      let reportId;
      if (existing) {
        await Report.update(existing.id, {
          total_score: overall,
          strengths: existing.strengths || null,
          weaknesses: existing.weaknesses || null,
          suggestions: existing.suggestions || null,
          report_json: payloadJson,
        });
        reportId = existing.id;
      } else {
        reportId = await Report.create({
          session_id: finalSessionId,
          total_score: overall,
          strengths: null,
          weaknesses: null,
          suggestions: null,
          report_json: payloadJson,
        });
      }

      return res.json({
        success: true,
        data: {
          markdown,
          report_id: reportId,
          session_id: finalSessionId,
          saved: true,
        },
      });
    } catch (saveErr) {
      console.warn("보고서 DB 저장 실패, 마크다운만 반환:", saveErr.message);
      return res.json({ success: true, data: { markdown, saved: false } });
    }
  } catch (error) {
    console.error("AI 마크다운 보고서 생성 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "보고서 생성 중 오류가 발생했습니다." });
  }
};
