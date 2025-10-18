const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLecturesColumns() {
  let connection;
  
  try {
    console.log('');
    console.log('📚 Lectures 테이블 컬럼 확인');
    console.log('');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });
    
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lectures'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'lms_system']);
    
    console.log('Lectures 테이블 컬럼 목록:');
    console.log('');
    columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkLecturesColumns();
