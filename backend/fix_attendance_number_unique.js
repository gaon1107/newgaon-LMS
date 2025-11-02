/**
 * students 테이블의 attendance_number 중복 제약 수정
 * 
 * 문제: UNIQUE (attendance_number) ← 전체 테이블에서 중복 확인
 * 해결: UNIQUE (tenant_id, attendance_number) ← 학원별로만 중복 확인
 * 
 * 실행: node fix_attendance_number_unique.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAttendanceNumberUnique() {
  let connection;
  
  try {
    console.log('');
    console.log('🔥 ==========================================');
    console.log('🔥  attendance_number UNIQUE 인덱스 수정');
    console.log('🔥 ==========================================');
    console.log('');
    
    console.log('🔄 MySQL 연결 중...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });
    
    console.log('✅ MySQL 연결 성공!');
    console.log('');
    
    // 1. 기존 UNIQUE 인덱스 확인
    console.log('🔍 기존 인덱스 확인 중...');
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students' AND INDEX_NAME LIKE '%attendance%'
      ORDER BY SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'lms_system']);
    
    if (indexes.length > 0) {
      console.log(`   발견된 attendance 관련 인덱스:`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME}`);
      });
      console.log('');
    }
    
    // 2. 기존 인덱스 삭제 (PRIMARY KEY 제외)
    console.log('🔧 기존 UNIQUE 인덱스 삭제 중...');
    
    try {
      await connection.execute(`
        ALTER TABLE students 
        DROP INDEX attendance_number
      `);
      console.log('   ✅ attendance_number 인덱스 삭제 완료');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ⚠️  attendance_number 인덱스가 없습니다');
      } else {
        console.log(`   ⚠️  ${error.message}`);
      }
    }
    
    console.log('');
    
    // 3. 새 UNIQUE 인덱스 생성 (tenant_id + attendance_number)
    console.log('🔧 새로운 UNIQUE 인덱스 생성 중...');
    console.log('   (tenant_id와 attendance_number 조합으로 중복 확인)');
    
    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD UNIQUE KEY uk_tenant_attendance_number (tenant_id, attendance_number)
      `);
      console.log('   ✅ 새 UNIQUE 인덱스 생성 완료!');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   ✅ 인덱스가 이미 존재합니다');
      } else {
        throw error;
      }
    }
    
    console.log('');
    
    // 4. 최종 확인
    console.log('✅ 최종 인덱스 확인:');
    const [finalIndexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'lms_system']);
    
    finalIndexes.forEach(idx => {
      const uniqueStatus = idx.NON_UNIQUE === 0 ? '(UNIQUE)' : '(일반)';
      console.log(`   - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} ${uniqueStatus}`);
    });
    
    console.log('');
    console.log('🎉 ==========================================');
    console.log('🎉  수정 완료!');
    console.log('🎉 ==========================================');
    console.log('');
    console.log('📌 변경 내용:');
    console.log('   ✅ 출결번호는 학원 내에서만 중복 확인');
    console.log('   ✅ 다른 학원의 출결번호와는 상관없음');
    console.log('');
    console.log('🚀 다음 단계:');
    console.log('   1. 백엔드 서버 재시작 (필수!)');
    console.log('   2. 브라우저 새로고침');
    console.log('   3. 학생 추가 테스트');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error.message);
    console.error('');
    console.error('💡 백엔드 터미널에 이 에러를 알려주세요:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL 연결 종료');
      console.log('');
    }
  }
}

fixAttendanceNumberUnique();
