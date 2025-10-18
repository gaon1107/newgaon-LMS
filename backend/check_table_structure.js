/**
 * 🔍 데이터베이스 테이블 구조 확인 스크립트
 * 
 * students, lectures 테이블의 'id' 컬럼 타입을 확인합니다
 * 
 * 실행: node check_table_structure.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
  let connection;
  
  try {
    console.log('');
    console.log('🔍 ==========================================');
    console.log('🔍  데이터베이스 테이블 구조 확인');
    console.log('🔍 ==========================================');
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
    
    // ========================================
    // 1. students 테이블 확인
    // ========================================
    console.log('👨‍🎓 ==========================================');
    console.log('👨‍🎓  STUDENTS 테이블 구조');
    console.log('👨‍🎓 ==========================================');
    console.log('');
    
    try {
      const [studentColumns] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'lms_system']);
      
      console.log(`✅ students 테이블 발견! (${studentColumns.length}개 컬럼)`);
      console.log('');
      
      const idCol = studentColumns.find(col => col.COLUMN_NAME === 'id');
      if (idCol) {
        console.log('💾 ID 컬럼 정보:');
        console.log(`   - 컬럼명: ${idCol.COLUMN_NAME}`);
        console.log(`   - 타입: ${idCol.COLUMN_TYPE}`);
        console.log(`   - 데이터타입: ${idCol.DATA_TYPE}`);
        console.log(`   - NULL 허용: ${idCol.IS_NULLABLE}`);
        console.log(`   - 키: ${idCol.COLUMN_KEY}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ students 테이블 확인 실패: ${error.message}`);
      console.log('');
    }
    
    // ========================================
    // 2. lectures 테이블 확인
    // ========================================
    console.log('📚 ==========================================');
    console.log('📚  LECTURES 테이블 구조');
    console.log('📚 ==========================================');
    console.log('');
    
    try {
      const [lectureColumns] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lectures'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'lms_system']);
      
      console.log(`✅ lectures 테이블 발견! (${lectureColumns.length}개 컬럼)`);
      console.log('');
      
      const idCol = lectureColumns.find(col => col.COLUMN_NAME === 'id');
      if (idCol) {
        console.log('💾 ID 컬럼 정보:');
        console.log(`   - 컬럼명: ${idCol.COLUMN_NAME}`);
        console.log(`   - 타입: ${idCol.COLUMN_TYPE}`);
        console.log(`   - 데이터타입: ${idCol.DATA_TYPE}`);
        console.log(`   - NULL 허용: ${idCol.IS_NULLABLE}`);
        console.log(`   - 키: ${idCol.COLUMN_KEY}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ lectures 테이블 확인 실패: ${error.message}`);
      console.log('');
    }
    
    // ========================================
    // 3. 모든 테이블 확인
    // ========================================
    console.log('🗂️  ==========================================');
    console.log('🗂️   모든 테이블 목록');
    console.log('🗂️  ==========================================');
    console.log('');
    
    const [allTables] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        TABLE_TYPE,
        TABLE_ROWS
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'lms_system']);
    
    allTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_NAME} (${table.TABLE_ROWS || 0}개 행)`);
    });
    console.log('');
    
    console.log('🎉 ==========================================');
    console.log('🎉  확인 완료!');
    console.log('🎉 ==========================================');
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

checkTableStructure();
