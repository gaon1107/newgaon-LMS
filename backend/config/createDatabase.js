const mysql = require('mysql2/promise');
require('dotenv').config();

// 단계별 데이터베이스 생성
const createDatabase = async () => {
  let connection;

  try {
    // MySQL 연결 (데이터베이스 없이)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    console.log('📋 데이터베이스 생성 시작...');

    // 1. 데이터베이스 생성
    await connection.query(`CREATE DATABASE IF NOT EXISTS lms_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 데이터베이스 lms_system 생성 완료');

    // 2. 데이터베이스 선택
    await connection.query('USE lms_system');
    console.log('✅ 데이터베이스 선택 완료');

    // 3. 외래키 체크 비활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 4. 기존 테이블 삭제 (역순)
    const dropTables = [
      'message_recipients',
      'message_history',
      'message_templates',
      'system_logs',
      'attendance_records',
      'student_lectures',
      'files',
      'announcements',
      'lectures',
      'students',
      'teachers',
      'users'
    ];

    for (const table of dropTables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ 테이블 ${table} 삭제 완료`);
      } catch (error) {
        console.log(`ℹ️  테이블 ${table} 삭제 스킵: ${error.message}`);
      }
    }

    // 5. 외래키 체크 재활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 데이터베이스 생성 및 정리 완료!');
    return true;

  } catch (error) {
    console.error('❌ 데이터베이스 생성 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createDatabase()
    .then(success => {
      if (success) {
        console.log('✅ 데이터베이스 생성 성공');
        process.exit(0);
      } else {
        console.log('❌ 데이터베이스 생성 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  createDatabase
};