const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInstructorsTable() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('✅ MySQL 연결 성공!\n');

    // instructors 테이블 존재 확인
    const [tables] = await connection.execute("SHOW TABLES LIKE 'instructors'");
    
    if (tables.length === 0) {
      console.log('⚠️  instructors 테이블이 존재하지 않습니다.\n');
      return;
    }

    console.log('📋 현재 instructors 테이블 구조:\n');
    const [columns] = await connection.execute('DESCRIBE instructors');
    
    console.table(columns.map(col => ({
      컬럼명: col.Field,
      타입: col.Type,
      NULL허용: col.Null,
      키: col.Key,
      기본값: col.Default
    })));

    // 데이터 확인
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM instructors');
    console.log(`\n📊 현재 등록된 강사: ${count[0].count}명\n`);

    if (count[0].count > 0) {
      console.log('등록된 강사 목록:\n');
      const [instructors] = await connection.execute('SELECT * FROM instructors LIMIT 5');
      console.table(instructors);
    }

    console.log('\n💡 해결 방법:');
    console.log('   1. 기존 테이블을 삭제하고 새로 만들기 (데이터 손실!)');
    console.log('   2. 기존 테이블 구조 유지하고 필요한 컬럼만 추가');
    console.log('\n다음 스크립트를 실행하세요:');
    console.log('   node scripts/fix_instructor_tables.js\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkInstructorsTable();
