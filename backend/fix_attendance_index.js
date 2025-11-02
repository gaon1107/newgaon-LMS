/**
 * students 테이블의 잘못된 인덱스 정리 스크립트
 * 
 * 문제: idx_attendance_number와 uk_tenant_attendance_number 인덱스 충돌
 * 해결: idx_attendance_number 삭제 + 복합 UNIQUE 인덱스만 유지
 * 
 * 실행: node fix_attendance_index.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAttendanceIndex() {
  let connection;
  
  try {
    console.log('');
    console.log('🔥 ==========================================');
    console.log('🔥  출결번호 인덱스 정리');
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
    
    // Step 1: 현재 인덱스 확인
    console.log('🔍 현재 인덱스 상태 확인...');
    const [currentIndexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'lms_system']);
    
    console.log('   발견된 인덱스:');
    currentIndexes.forEach(idx => {
      const uniqueText = idx.NON_UNIQUE === 0 ? '[UNIQUE]' : '[일반]';
      console.log(`   - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} ${uniqueText}`);
    });
    console.log('');
    
    // Step 2: idx_attendance_number 인덱스 삭제 (잘못된 인덱스)
    console.log('🔧 Step 1: 잘못된 인덱스 삭제 중...');
    try {
      await connection.execute(`
        ALTER TABLE students 
        DROP INDEX idx_attendance_number
      `);
      console.log('   ✅ idx_attendance_number 삭제 완료');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ℹ️  이미 없는 인덱스입니다');
      } else if (error.code === 'ER_WRONG_DB_NAME') {
        console.log('   ℹ️  삭제 불필요 (인덱스 없음)');
      } else {
        throw error;
      }
    }
    console.log('');
    
    // Step 3: 복합 UNIQUE 인덱스 확인
    console.log('🔧 Step 2: 복합 UNIQUE 인덱스 확인...');
    const [compositeIndex] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students' 
        AND INDEX_NAME = 'uk_tenant_attendance_number'
      ORDER BY SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'lms_system']);
    
    if (compositeIndex.length === 2) {
      console.log('   ✅ 복합 UNIQUE 인덱스 정상 작동');
      compositeIndex.forEach(idx => {
        console.log(`      - ${idx.COLUMN_NAME} (순서: ${idx.SEQ_IN_INDEX})`);
      });
    } else {
      console.log('   ⚠️  복합 인덱스가 불완전합니다');
      console.log('   🔧 복합 인덱스 재구성 중...');
      
      // 기존 인덱스 삭제
      try {
        await connection.execute(`
          ALTER TABLE students 
          DROP INDEX uk_tenant_attendance_number
        `);
      } catch (e) {
        // 무시
      }
      
      // 새 인덱스 생성
      await connection.execute(`
        ALTER TABLE students 
        ADD UNIQUE KEY uk_tenant_attendance_number (tenant_id, attendance_number)
      `);
      console.log('   ✅ 복합 UNIQUE 인덱스 재구성 완료');
    }
    console.log('');
    
    // Step 4: 최종 인덱스 상태
    console.log('✅ 최종 인덱스 상태:');
    const [finalIndexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'lms_system']);
    
    const indexGroups = {};
    finalIndexes.forEach(idx => {
      if (!indexGroups[idx.INDEX_NAME]) {
        indexGroups[idx.INDEX_NAME] = [];
      }
      indexGroups[idx.INDEX_NAME].push({
        column: idx.COLUMN_NAME,
        seq: idx.SEQ_IN_INDEX,
        unique: idx.NON_UNIQUE === 0
      });
    });
    
    Object.entries(indexGroups).forEach(([name, columns]) => {
      const uniqueText = columns[0].unique ? '[UNIQUE]' : '[일반]';
      const columnNames = columns.map(c => c.column).join(', ');
      console.log(`   - ${name}: ${columnNames} ${uniqueText}`);
    });
    
    console.log('');
    console.log('🎉 ==========================================');
    console.log('🎉  완료!');
    console.log('🎉 ==========================================');
    console.log('');
    console.log('📌 정리된 내용:');
    console.log('   ✅ 출결번호는 학원 내에서만 중복 확인');
    console.log('   ✅ 같은 번호로 2번 추가하면 에러 발생');
    console.log('');
    console.log('🚀 다음 단계:');
    console.log('   1. 백엔드 서버 재시작 (매우 중요!)');
    console.log('   2. 브라우저 새로고침');
    console.log('   3. 같은 출결번호로 2번 추가 테스트');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error.message);
    console.error('');
    console.error('MySQL 오류 상세:');
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

fixAttendanceIndex();
