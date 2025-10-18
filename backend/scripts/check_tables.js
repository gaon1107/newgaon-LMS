const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLecturesTable() {
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

    // lectures 테이블 구조 확인
    console.log('📋 lectures 테이블 구조:\n');
    const [columns] = await connection.execute('DESCRIBE lectures');
    
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // instructors 테이블 확인
    console.log('\n📋 instructors 테이블 구조:\n');
    const [instColumns] = await connection.execute('DESCRIBE instructors');
    
    console.table(instColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // instructors 데이터 확인
    console.log('\n📊 현재 등록된 강사:\n');
    const [instructors] = await connection.execute('SELECT id, name, department, phone FROM instructors');
    
    if (instructors.length > 0) {
      console.table(instructors);
      console.log(`\n✅ 총 ${instructors.length}명의 강사가 등록되어 있습니다!`);
    } else {
      console.log('⚠️ 등록된 강사가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkLecturesTable();
