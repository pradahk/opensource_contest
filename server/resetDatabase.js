const { pool, createTables } = require("./config/dbConfig");

async function resetDatabase() {
  try {
    console.log("데이터베이스 테이블을 재설정합니다...");

    // 기존 테이블 삭제 (외래키 제약조건 때문에 순서 중요)
    const tablesToDrop = [
      "ai_interview_feedback",
      "ai_interview_answers",
      "ai_interview_questions",
      "ai_interview_sessions",
      "voice_analysis_results",
      "user_answers",
      "feedback_reports",
      "interview_sessions",
      "interview_questions",
      "user_interest_companies",
      "self_introductions",
      "resumes",
      "companies",
      "users",
    ];

    for (const table of tablesToDrop) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`${table} 테이블 삭제 완료`);
      } catch (error) {
        console.log(`${table} 테이블 삭제 실패:`, error.message);
      }
    }

    console.log("모든 테이블이 삭제되었습니다. 새로운 테이블을 생성합니다...");

    // 새로운 테이블 생성
    await createTables(pool);

    console.log("데이터베이스 재설정이 완료되었습니다.");
  } catch (error) {
    console.error("데이터베이스 재설정 오류:", error);
  } finally {
    process.exit(0);
  }
}

resetDatabase();
