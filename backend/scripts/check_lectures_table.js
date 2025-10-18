const mysql = require('mysql2/promise');

async function checkLecturesTable() {
  let connection;

  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });

    console.log('✅ 데이터베이스 연결 성공\n');

    // lectures 테이블 구조 확인
    console.log('📋 lectures 테이블 구조:\n');
    const [columns] = await connection.execute('DESCRIBE lectures');

    console.table(columns);

    // 현재 강의 데이터 확인
    console.log('\n📚 현재 저장된 강의 목록:\n');
    const [lectures] = await connection.execute('SELECT * FROM lectures LIMIT 10');

    console.log(`총 ${lectures.length}개의 강의가 있습니다.\n`);

    if (lectures.length > 0) {
      console.log('첫 번째 강의 예시:');
      console.log(JSON.stringify(lectures[0], null, 2));
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ 데이터베이스 연결 종료');
    }
  }
}

checkLecturesTable();
