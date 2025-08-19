const { pool } = require("../config/dbConfig");

/**
 * 음성 시스템 통합을 위한 데이터베이스 마이그레이션
 *
 * 1. voice_analysis_results 테이블에 누락된 컬럼 추가
 * 2. feedback_reports 테이블에 누락된 컬럼 추가
 * 3. 기존 데이터 마이그레이션
 */

async function migrateVoiceSystem() {
  const connection = await pool.getConnection();

  try {
    console.log("=== 음성 시스템 통합 마이그레이션 시작 ===");

    // 1. voice_analysis_results 테이블 컬럼 추가
    console.log("1. voice_analysis_results 테이블 업데이트 중...");

    const voiceColumns = [
      {
        name: "pitch_variation",
        sql: "ADD COLUMN pitch_variation DECIMAL(5,2) DEFAULT 0.0",
      },
      {
        name: "confidence_score",
        sql: "ADD COLUMN confidence_score DECIMAL(5,2)",
      },
      {
        name: "analysis_type",
        sql: "ADD COLUMN analysis_type ENUM('assemblyai', 'openai', 'combined') DEFAULT 'assemblyai'",
      },
      { name: "raw_analysis_data", sql: "ADD COLUMN raw_analysis_data JSON" },
      {
        name: "created_at",
        sql: "ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      },
      {
        name: "updated_at",
        sql: "ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      },
    ];

    for (const column of voiceColumns) {
      try {
        // 컬럼 존재 여부 확인
        const [columnExists] = await connection.query(
          `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'voice_analysis_results' 
          AND COLUMN_NAME = ?
        `,
          [column.name]
        );

        if (columnExists.length === 0) {
          await connection.query(
            `ALTER TABLE voice_analysis_results ${column.sql}`
          );
          console.log(`✓ voice_analysis_results: ${column.name} 추가됨`);
        } else {
          console.log(`- voice_analysis_results: ${column.name} (이미 존재)`);
        }
      } catch (error) {
        console.error(
          `✗ voice_analysis_results: ${column.name} - ${error.message}`
        );
      }
    }

    // 2. feedback_reports 테이블 컬럼 추가
    console.log("\n2. feedback_reports 테이블 업데이트 중...");

    const feedbackColumns = [
      { name: "strengths", sql: "ADD COLUMN strengths TEXT" },
      { name: "weaknesses", sql: "ADD COLUMN weaknesses TEXT" },
      { name: "suggestions", sql: "ADD COLUMN suggestions TEXT" },
      { name: "report_json", sql: "ADD COLUMN report_json JSON" },
      {
        name: "updated_at",
        sql: "ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      },
    ];

    for (const column of feedbackColumns) {
      try {
        // 컬럼 존재 여부 확인
        const [columnExists] = await connection.query(
          `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'feedback_reports' 
          AND COLUMN_NAME = ?
        `,
          [column.name]
        );

        if (columnExists.length === 0) {
          await connection.query(`ALTER TABLE feedback_reports ${column.sql}`);
          console.log(`✓ feedback_reports: ${column.name} 추가됨`);
        } else {
          console.log(`- feedback_reports: ${column.name} (이미 존재)`);
        }
      } catch (error) {
        console.error(`✗ feedback_reports: ${column.name} - ${error.message}`);
      }
    }

    // 3. total_score 컬럼 크기 확장
    console.log("\n3. 스코어 컬럼 크기 확장 중...");
    try {
      await connection.query(
        `ALTER TABLE feedback_reports MODIFY COLUMN total_score DECIMAL(5,2)`
      );
      console.log("✓ feedback_reports.total_score DECIMAL(5,2)로 확장");
    } catch (error) {
      console.log(`- feedback_reports.total_score 수정 실패: ${error.message}`);
    }

    try {
      await connection.query(
        `ALTER TABLE voice_analysis_results MODIFY COLUMN pronunciation_score DECIMAL(5,2)`
      );
      console.log(
        "✓ voice_analysis_results.pronunciation_score DECIMAL(5,2)로 확장"
      );
    } catch (error) {
      console.log(
        `- voice_analysis_results.pronunciation_score 수정 실패: ${error.message}`
      );
    }

    // 4. 기존 데이터 마이그레이션
    console.log("\n4. 기존 데이터 마이그레이션 중...");

    // confidence_score 컬럼이 존재하는지 확인 후 마이그레이션
    const [confidenceColumnExists] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'voice_analysis_results' 
      AND COLUMN_NAME = 'confidence_score'
    `);

    if (confidenceColumnExists.length > 0) {
      const [updateResult1] = await connection.query(`
        UPDATE voice_analysis_results 
        SET confidence_score = pronunciation_score 
        WHERE confidence_score IS NULL AND pronunciation_score IS NOT NULL
      `);
      console.log(
        `✓ confidence_score 마이그레이션: ${updateResult1.affectedRows}건`
      );
    } else {
      console.log("- confidence_score 컬럼이 존재하지 않아 마이그레이션 스킵");
    }

    // analysis_type 컬럼이 존재하는지 확인 후 마이그레이션
    const [analysisTypeColumnExists] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'voice_analysis_results' 
      AND COLUMN_NAME = 'analysis_type'
    `);

    if (analysisTypeColumnExists.length > 0) {
      const [updateResult2] = await connection.query(`
        UPDATE voice_analysis_results 
        SET analysis_type = 'assemblyai' 
        WHERE analysis_type IS NULL
      `);
      console.log(
        `✓ analysis_type 마이그레이션: ${updateResult2.affectedRows}건`
      );
    } else {
      console.log("- analysis_type 컬럼이 존재하지 않아 마이그레이션 스킵");
    }

    // 5. 인덱스 추가 (성능 최적화)
    console.log("\n5. 인덱스 추가 중...");

    const indexes = [
      {
        name: "idx_voice_analysis_type",
        sql: "CREATE INDEX idx_voice_analysis_type ON voice_analysis_results(analysis_type)",
      },
      {
        name: "idx_voice_created_at",
        sql: "CREATE INDEX idx_voice_created_at ON voice_analysis_results(created_at)",
      },
      {
        name: "idx_feedback_updated_at",
        sql: "CREATE INDEX idx_feedback_updated_at ON feedback_reports(updated_at)",
      },
    ];

    for (const index of indexes) {
      try {
        // 인덱스 존재 여부 확인
        const [indexExists] = await connection.query(
          `
          SELECT INDEX_NAME 
          FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND INDEX_NAME = ?
        `,
          [index.name]
        );

        if (indexExists.length === 0) {
          await connection.query(index.sql);
          console.log(`✓ 인덱스 생성: ${index.name}`);
        } else {
          console.log(`- 인덱스 이미 존재: ${index.name}`);
        }
      } catch (error) {
        console.error(`✗ 인덱스 생성 실패 ${index.name}: ${error.message}`);
      }
    }

    // 6. 통계 정보 출력
    console.log("\n6. 마이그레이션 완료 통계:");

    const [voiceStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN analysis_type = 'assemblyai' THEN 1 END) as assemblyai_count,
        COUNT(CASE WHEN analysis_type = 'combined' THEN 1 END) as combined_count,
        COUNT(CASE WHEN pitch_variation IS NOT NULL THEN 1 END) as pitch_variation_count,
        COUNT(CASE WHEN raw_analysis_data IS NOT NULL THEN 1 END) as raw_data_count
      FROM voice_analysis_results
    `);

    const [feedbackStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN strengths IS NOT NULL THEN 1 END) as strengths_count,
        COUNT(CASE WHEN report_json IS NOT NULL THEN 1 END) as report_json_count
      FROM feedback_reports
    `);

    console.log("📊 voice_analysis_results 통계:");
    console.log(`   - 전체 레코드: ${voiceStats[0].total_records}건`);
    console.log(`   - AssemblyAI 타입: ${voiceStats[0].assemblyai_count}건`);
    console.log(`   - 통합 타입: ${voiceStats[0].combined_count}건`);
    console.log(
      `   - pitch_variation 있음: ${voiceStats[0].pitch_variation_count}건`
    );
    console.log(`   - raw_data 있음: ${voiceStats[0].raw_data_count}건`);

    console.log("\n📊 feedback_reports 통계:");
    console.log(`   - 전체 레코드: ${feedbackStats[0].total_records}건`);
    console.log(`   - strengths 있음: ${feedbackStats[0].strengths_count}건`);
    console.log(
      `   - report_json 있음: ${feedbackStats[0].report_json_count}건`
    );

    console.log("\n=== 음성 시스템 통합 마이그레이션 완료 ===");

    return {
      success: true,
      voice_stats: voiceStats[0],
      feedback_stats: feedbackStats[0],
    };
  } catch (error) {
    console.error("마이그레이션 오류:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// 마이그레이션 실행 (직접 실행 시)
if (require.main === module) {
  migrateVoiceSystem()
    .then((result) => {
      console.log("마이그레이션 성공:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("마이그레이션 실패:", error);
      process.exit(1);
    });
}

module.exports = { migrateVoiceSystem };
