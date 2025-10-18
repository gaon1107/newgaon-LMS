const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAttendanceData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });
    
    const [result] = await connection.execute('SELECT COUNT(*) as total FROM attendance');
    console.log('');
    console.log('📊 Attendance 테이블 데이터 개수:');
    console.log(`   총 ${result[0].total}개`);
    console.log('');
    
    if (result[0].total > 0) {
      const [data] = await connection.execute('SELECT * FROM attendance LIMIT 5');
      console.log('최근 5개 데이터:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('⚠️  데이터가 없습니다. (테이블은 있음)');
    }
    
  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkAttendanceData();
