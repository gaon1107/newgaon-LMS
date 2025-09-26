const mysql = require('mysql2/promise');
require('dotenv').config();

const checkData = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 데이터 확인 중...');

    // 1. student_lectures 테이블 구조 확인
    const [columns] = await connection.query(`
      DESCRIBE student_lectures
    `);
    console.log('\n📊 student_lectures 테이블 구조:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null}, ${col.Key})`);
    });

    // 2. student_lectures 데이터 확인
    const [data] = await connection.query(`
      SELECT * FROM student_lectures LIMIT 10
    `);
    console.log('\n📊 student_lectures 데이터 (최대 10개):');
    data.forEach((row, idx) => {
      console.log(`${idx + 1}. student_id: ${row.student_id}, lecture_id: ${row.lecture_id}, is_active: ${row.is_active}`);
    });

    // 3. lectures 테이블 존재 여부 확인
    try {
      const [lectureData] = await connection.query('SELECT COUNT(*) as count FROM lectures');
      console.log(`\n📊 lectures 테이블 데이터 개수: ${lectureData[0].count}`);
    } catch (error) {
      console.log('\n❌ lectures 테이블이 존재하지 않음');
    }

    // 4. instructors 테이블 데이터 확인
    try {
      const [instructorData] = await connection.query('SELECT COUNT(*) as count FROM instructors');
      console.log(`📊 instructors 테이블 데이터 개수: ${instructorData[0].count}`);
    } catch (error) {
      console.log('❌ instructors 테이블이 존재하지 않음');
    }

  } catch (error) {
    console.error('❌ 데이터 확인 실패:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

checkData();