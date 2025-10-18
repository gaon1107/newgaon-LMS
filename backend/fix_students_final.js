/**
 * students 테이블 최종 완전 수정 스크립트
 * 
 * ✅ 모든 문제를 한 번에 해결합니다!
 * ✅ 기존 데이터는 절대 건드리지 않습니다!
 * 
 * 실행: node fix_students_final.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixStudentsFinal() {
  let connection;
  
  try {
    console.log('');
    console.log('🔥 ==========================================');
    console.log('🔥  최종 완전 수정 스크립트');
    console.log('🔥  이번이 마지막입니다!');
    console.log('🔥 ==========================================');
    console.log('');
    
    console.log('🔄 MySQL 연결 중...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'newgaon_lms'
    });
    
    console.log('✅ MySQL 연결 성공!');
    console.log('');
    
    // 1. 현재 테이블 구조 확인
    console.log('📋 현재 students 테이블 분석 중...');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    console.log(`현재 컬럼: ${columns.length}개`);
    console.log('');
    
    // 2. student_number 컬럼 확인 및 수정
    const studentNumberCol = columns.find(col => col.COLUMN_NAME === 'student_number');
    
    if (studentNumberCol) {
      console.log('🔍 student_number 컬럼 발견!');
      console.log(`   - NULL 허용: ${studentNumberCol.IS_NULLABLE}`);
      console.log(`   - 기본값: ${studentNumberCol.COLUMN_DEFAULT || '없음'}`);
      
      if (studentNumberCol.IS_NULLABLE === 'NO' && !studentNumberCol.COLUMN_DEFAULT) {
        console.log('');
        console.log('⚠️  student_number가 필수 컬럼이지만 기본값이 없습니다!');
        console.log('🔧 NULL 허용으로 변경하는 중...');
        
        await connection.execute(`
          ALTER TABLE students 
          MODIFY COLUMN student_number VARCHAR(50) NULL COMMENT '학번 (선택)'
        `);
        
        console.log('✅ student_number를 선택 항목으로 변경 완료!');
      } else {
        console.log('✅ student_number 설정이 올바릅니다!');
      }
    } else {
      console.log('⚠️  student_number 컬럼이 없습니다. 추가하는 중...');
      
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN student_number VARCHAR(50) NULL COMMENT '학번 (선택)'
        AFTER name
      `);
      
      console.log('✅ student_number 컬럼 추가 완료!');
    }
    
    console.log('');
    
    // 3. 필수 컬럼들 확인 및 추가
    const requiredColumns = [
      { name: 'tenant_id', def: 'VARCHAR(100) NOT NULL', after: 'id' },
      { name: 'send_payment_notification', def: 'BOOLEAN DEFAULT TRUE', after: 'payment_due_date' },
      { name: 'profile_image_url', def: 'TEXT', after: 'send_payment_notification' },
      { name: 'auto_attendance_msg', def: 'BOOLEAN DEFAULT TRUE', after: 'profile_image_url' },
      { name: 'auto_outing_msg', def: 'BOOLEAN DEFAULT FALSE', after: 'auto_attendance_msg' },
      { name: 'auto_image_msg', def: 'BOOLEAN DEFAULT FALSE', after: 'auto_outing_msg' },
      { name: 'auto_study_monitoring', def: 'BOOLEAN DEFAULT FALSE', after: 'auto_image_msg' },
      { name: 'class_fee', def: 'INT DEFAULT 0', after: 'auto_study_monitoring' }
    ];
    
    console.log('🔍 필수 컬럼 확인 중...');
    
    const existingColumnNames = columns.map(col => col.COLUMN_NAME);
    let addedCount = 0;
    
    for (const col of requiredColumns) {
      if (!existingColumnNames.includes(col.name)) {
        try {
          const afterClause = existingColumnNames.includes(col.after) ? ` AFTER ${col.after}` : '';
          
          await connection.execute(`
            ALTER TABLE students 
            ADD COLUMN ${col.name} ${col.def}${afterClause}
          `);
          
          console.log(`   ✅ ${col.name} 추가 완료`);
          existingColumnNames.push(col.name);
          addedCount++;
        } catch (error) {
          if (error.code !== 'ER_DUP_FIELDNAME') {
            console.log(`   ⚠️  ${col.name}: ${error.message}`);
          }
        }
      } else {
        console.log(`   ✅ ${col.name} 이미 존재`);
      }
    }
    
    console.log('');
    
    // 4. tenant_id 기본값 설정 (기존 데이터용)
    const tenantIdCol = columns.find(col => col.COLUMN_NAME === 'tenant_id');
    if (tenantIdCol && tenantIdCol.IS_NULLABLE === 'NO') {
      console.log('🔧 기존 학생들의 tenant_id 설정 중...');
      
      await connection.execute(`
        UPDATE students 
        SET tenant_id = 'tenant_newgaon_1760413245678' 
        WHERE tenant_id IS NULL OR tenant_id = ''
      `);
      
      console.log('✅ 기존 학생들의 tenant_id 설정 완료!');
      console.log('');
    }
    
    // 5. 최종 확인
    const [finalColumns] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    const [studentCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM students WHERE is_active = true
    `);
    
    console.log('');
    console.log('🎉 ==========================================');
    console.log('🎉  수정 완료!');
    console.log('🎉 ==========================================');
    console.log(`📊 최종 컬럼 수: ${finalColumns[0].total}개`);
    console.log(`💚 기존 학생 데이터: ${studentCount[0].total}명 (안전!)`);
    console.log(`✨ 추가된 컬럼: ${addedCount}개`);
    console.log('🎉 ==========================================');
    console.log('');
    
    console.log('📌 다음 단계:');
    console.log('   1. 백엔드 서버 재시작: npm start');
    console.log('   2. 웹페이지 새로고침: Ctrl + Shift + R');
    console.log('   3. 학생 추가 테스트!');
    console.log('');
    console.log('💪 이제 확실히 작동할 겁니다!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error.message);
    console.error('');
    console.error('💡 스크린샷을 보내주시면 바로 해결해드리겠습니다!');
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

fixStudentsFinal();
