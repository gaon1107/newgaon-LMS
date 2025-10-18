/**
 * students 테이블 수정 스크립트
 * 누락된 컬럼을 추가합니다.
 * 
 * 실행 방법:
 * cd backend
 * node fix_students_table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixStudentsTable() {
  let connection;
  
  try {
    console.log('🔄 MySQL 연결 중...');
    
    // MySQL 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'newgaon_lms'
    });
    
    console.log('✅ MySQL 연결 성공!');
    console.log('');
    
    // 1. 현재 테이블 구조 확인
    console.log('📋 현재 students 테이블 구조 확인 중...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    console.log(`현재 컬럼 수: ${columns.length}개`);
    
    // 2. send_payment_notification 컬럼 확인
    const hasPaymentNotification = columns.some(col => col.COLUMN_NAME === 'send_payment_notification');
    
    if (hasPaymentNotification) {
      console.log('✅ send_payment_notification 컬럼이 이미 존재합니다.');
    } else {
      console.log('⚠️ send_payment_notification 컬럼이 없습니다. 추가하는 중...');
      
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN send_payment_notification BOOLEAN DEFAULT TRUE 
        COMMENT '결제 안내 문자 발송 여부'
      `);
      
      console.log('✅ send_payment_notification 컬럼 추가 완료!');
    }
    
    console.log('');
    console.log('🎉 모든 작업이 완료되었습니다!');
    console.log('');
    console.log('📌 다음 단계:');
    console.log('   1. 백엔드 서버를 재시작하세요 (Ctrl+C 후 npm start)');
    console.log('   2. 웹페이지를 새로고침하세요 (F5)');
    console.log('   3. 학생 추가를 다시 시도하세요');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('');
    console.error('💡 해결 방법:');
    console.error('   1. MySQL이 실행 중인지 확인하세요');
    console.error('   2. backend/.env 파일의 DB 설정을 확인하세요');
    console.error('   3. DB_HOST, DB_USER, DB_PASSWORD, DB_NAME이 올바른지 확인하세요');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('');
      console.log('🔌 MySQL 연결 종료');
    }
  }
}

// 스크립트 실행
fixStudentsTable();
