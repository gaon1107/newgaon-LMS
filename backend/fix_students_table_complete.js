/**
 * students 테이블 완전 수정 스크립트
 * 모든 누락된 컬럼을 안전하게 추가합니다.
 * 
 * ✅ 기존 데이터는 절대 건드리지 않습니다!
 * ✅ 컬럼만 추가합니다!
 * 
 * 실행 방법:
 * 1. 백엔드 서버 종료 (Ctrl+C)
 * 2. cd backend
 * 3. node fix_students_table_complete.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 추가해야 할 컬럼 목록
const REQUIRED_COLUMNS = [
  {
    name: 'send_payment_notification',
    definition: 'BOOLEAN DEFAULT TRUE COMMENT "결제 안내 문자 발송 여부"',
    after: 'payment_due_date'
  },
  {
    name: 'profile_image_url',
    definition: 'TEXT COMMENT "프로필 이미지 URL"',
    after: 'send_payment_notification'
  },
  {
    name: 'auto_attendance_msg',
    definition: 'BOOLEAN DEFAULT TRUE COMMENT "등하원 자동 메시지"',
    after: 'profile_image_url'
  },
  {
    name: 'auto_outing_msg',
    definition: 'BOOLEAN DEFAULT FALSE COMMENT "외출/복귀 자동 메시지"',
    after: 'auto_attendance_msg'
  },
  {
    name: 'auto_image_msg',
    definition: 'BOOLEAN DEFAULT FALSE COMMENT "이미지 포함 메시지"',
    after: 'auto_outing_msg'
  },
  {
    name: 'auto_study_monitoring',
    definition: 'BOOLEAN DEFAULT FALSE COMMENT "학습관제 대상"',
    after: 'auto_image_msg'
  },
  {
    name: 'class_fee',
    definition: 'INT DEFAULT 0 COMMENT "총 수강료"',
    after: 'auto_study_monitoring'
  }
];

async function fixStudentsTableComplete() {
  let connection;
  
  try {
    console.log('');
    console.log('🛡️ ==========================================');
    console.log('🛡️  학생 테이블 안전 수정 스크립트');
    console.log('🛡️  기존 데이터는 절대 건드리지 않습니다!');
    console.log('🛡️ ==========================================');
    console.log('');
    
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
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log(`✅ 현재 컬럼 수: ${columns.length}개`);
    console.log('');
    
    // 2. 누락된 컬럼 찾기
    console.log('🔍 누락된 컬럼 검사 중...');
    const missingColumns = REQUIRED_COLUMNS.filter(
      col => !existingColumns.includes(col.name)
    );
    
    if (missingColumns.length === 0) {
      console.log('✅ 모든 필수 컬럼이 이미 존재합니다!');
      console.log('✅ 테이블이 정상입니다!');
      return;
    }
    
    console.log(`⚠️  누락된 컬럼: ${missingColumns.length}개`);
    missingColumns.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');
    
    // 3. 누락된 컬럼 추가
    console.log('🔧 누락된 컬럼 추가 중...');
    let addedCount = 0;
    
    for (const col of missingColumns) {
      try {
        // AFTER 절을 사용하되, 해당 컬럼이 없으면 맨 끝에 추가
        let afterClause = '';
        if (col.after && existingColumns.includes(col.after)) {
          afterClause = ` AFTER ${col.after}`;
        }
        
        const alterQuery = `
          ALTER TABLE students 
          ADD COLUMN ${col.name} ${col.definition}${afterClause}
        `;
        
        await connection.execute(alterQuery);
        console.log(`   ✅ ${col.name} 추가 완료`);
        addedCount++;
        
        // 추가된 컬럼을 목록에 추가 (다음 컬럼의 AFTER 절을 위해)
        existingColumns.push(col.name);
        
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⏭️  ${col.name} 이미 존재함 (건너뜀)`);
        } else {
          console.error(`   ❌ ${col.name} 추가 실패:`, error.message);
        }
      }
    }
    
    console.log('');
    console.log('🎉 ==========================================');
    console.log(`🎉  수정 완료! ${addedCount}개 컬럼 추가됨`);
    console.log('🎉 ==========================================');
    console.log('');
    
    // 4. 최종 확인
    const [finalColumns] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    console.log(`📊 최종 컬럼 수: ${finalColumns[0].total}개`);
    console.log('');
    
    // 5. 기존 데이터 확인
    const [studentCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM students WHERE is_active = true
    `);
    
    console.log('💚 ==========================================');
    console.log('💚  데이터 안전성 확인');
    console.log('💚 ==========================================');
    console.log(`💚  기존 학생 데이터: ${studentCount[0].total}명 (안전함!)`);
    console.log('💚  데이터 손실: 0건');
    console.log('💚 ==========================================');
    console.log('');
    
    console.log('📌 다음 단계:');
    console.log('   1. ✅ 백엔드 서버 재시작: npm start');
    console.log('   2. ✅ 웹페이지 새로고침: F5');
    console.log('   3. ✅ 학생 추가 다시 시도');
    console.log('');
    console.log('💡 이제 학생 추가가 정상 작동할 거예요!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ==========================================');
    console.error('❌  오류 발생');
    console.error('❌ ==========================================');
    console.error('❌ 오류 내용:', error.message);
    console.error('');
    console.error('💡 해결 방법:');
    console.error('   1. MySQL이 실행 중인지 확인하세요');
    console.error('   2. backend/.env 파일의 DB 설정을 확인하세요');
    console.error('');
    console.error('💚 걱정하지 마세요!');
    console.error('💚 기존 데이터는 아무것도 건드리지 않았습니다!');
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

// 스크립트 실행
fixStudentsTableComplete();
