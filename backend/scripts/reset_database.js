const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터베이스 완전 재설정
const resetDatabase = async () => {
  let connection;

  try {
    console.log('🔧 MySQL 데이터베이스 완전 재설정 시작...');

    // 먼저 데이터베이스 없이 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    // 기존 데이터베이스 삭제
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'lms_system'}`);
    console.log('✅ 기존 데이터베이스 삭제 완료');

    // 새 데이터베이스 생성
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME || 'lms_system'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 새 데이터베이스 생성 완료');

    // 데이터베이스 선택
    await connection.query(`USE ${process.env.DB_NAME || 'lms_system'}`);

    console.log('🎉 데이터베이스 재설정 완료!');
    return true;

  } catch (error) {
    console.error('❌ 데이터베이스 재설정 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행
if (require.main === module) {
  resetDatabase()
    .then(success => {
      if (success) {
        console.log('✅ 데이터베이스 재설정 성공');
        process.exit(0);
      } else {
        console.log('❌ 데이터베이스 재설정 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };