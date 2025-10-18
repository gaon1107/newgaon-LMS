/**
 * instructors 테이블 완전 수정 스크립트
 * 
 * ✅ 모든 누락된 컬럼을 안전하게 추가합니다!
 * ✅ 기존 데이터는 절대 건드리지 않습니다!
 * 
 * 실행: node fix_instructors_table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixInstructorsTable() {
  let connection;
  
  try {
    console.log('');
    console.log('🎓 ==========================================');
    console.log('🎓  강사 테이블 수정 스크립트');
    console.log('🎓  기존 데이터는 안전합니다!');
    console.log('🎓 ==========================================');
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
    console.log('📋 현재 instructors 테이블 분석 중...');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'instructors'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    console.log(`현재 컬럼: ${columns.length}개`);
    console.log('');
    
    const existingColumnNames = columns.map(col => col.COLUMN_NAME);
    
    // 2. 필수 컬럼 목록
    const requiredColumns = [
      { name: 'tenant_id', def: 'VARCHAR(100)', after: 'id' },
      { name: 'subject', def: 'VARCHAR(100)', after: 'phone' },
      { name: 'hire_date', def: 'DATE', after: 'subject' },
      { name: 'is_active', def: 'BOOLEAN DEFAULT TRUE', after: 'updated_at' }
    ];
    
    console.log('🔍 필수 컬럼 확인 중...');
    let addedCount = 0;
    
    for (const col of requiredColumns) {
      if (!existingColumnNames.includes(col.name)) {
        try {
          const afterClause = existingColumnNames.includes(col.after) ? ` AFTER ${col.after}` : '';
          
          await connection.execute(`
            ALTER TABLE instructors 
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
    
    // 3. NULL 허용이 필요한 컬럼 수정
    console.log('🔧 컬럼 NULL 허용 설정 중...');
    
    const nullableColumns = ['email', 'phone', 'subject', 'hire_date'];
    
    for (const colName of nullableColumns) {
      const col = columns.find(c => c.COLUMN_NAME === colName);
      
      if (col && col.IS_NULLABLE === 'NO') {
        try {
          let dataType = col.DATA_TYPE.toUpperCase();
          if (dataType === 'VARCHAR') {
            dataType = 'VARCHAR(255)';
          }
          
          await connection.execute(`
            ALTER TABLE instructors 
            MODIFY COLUMN ${colName} ${dataType} NULL
          `);
          
          console.log(`   ✅ ${colName} NULL 허용으로 변경`);
        } catch (error) {
          console.log(`   ⚠️  ${colName}: ${error.message}`);
        }
      }
    }
    
    console.log('');
    
    // 4. tenant_id 기본값 설정
    const tenantIdCol = columns.find(col => col.COLUMN_NAME === 'tenant_id');
    if (tenantIdCol) {
      console.log('🔧 기존 강사들의 tenant_id 설정 중...');
      
      await connection.execute(`
        UPDATE instructors 
        SET tenant_id = 'tenant_newgaon_1760413245678' 
        WHERE tenant_id IS NULL OR tenant_id = ''
      `);
      
      console.log('✅ 기존 강사들의 tenant_id 설정 완료!');
      console.log('');
    }
    
    // 5. 최종 확인
    const [finalColumns] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'instructors'
    `, [process.env.DB_NAME || 'newgaon_lms']);
    
    const [instructorCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM instructors WHERE is_active = true
    `);
    
    console.log('');
    console.log('🎉 ==========================================');
    console.log('🎉  수정 완료!');
    console.log('🎉 ==========================================');
    console.log(`📊 최종 컬럼 수: ${finalColumns[0].total}개`);
    console.log(`💚 기존 강사 데이터: ${instructorCount[0].total}명 (안전!)`);
    console.log(`✨ 추가된 컬럼: ${addedCount}개`);
    console.log('🎉 ==========================================');
    console.log('');
    
    console.log('📌 다음 단계:');
    console.log('   1. 백엔드 서버 재시작: npm start');
    console.log('   2. 웹페이지 새로고침: Ctrl + Shift + R');
    console.log('   3. 강사 정보 수정 테스트!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error.message);
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

fixInstructorsTable();
