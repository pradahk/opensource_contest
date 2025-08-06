const mysql = require("mysql2/promise");
const { createTables } = require("./dbConfig");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(
      "Successfully connected to the database (from db.js) as ID " +
        connection.threadId
    );
    connection.release();

    // 데이터베이스 테이블 생성
    await createTables(pool);
  } catch (err) {
    console.error("Error connecting to the database (from db.js):", err);
  }
}

testConnection();
module.exports = pool;
