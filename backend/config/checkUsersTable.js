const mysql = require('mysql2/promise');
require('dotenv').config();

// users 테이블 구조 확인
const checkUsersTable = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 users 테이블 구조 확인...');

    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users
    `);

    console.log('\n=== users 테이블 컬럼 정보 ===');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Key ? `(${col.Key})` : ''}`);
    });

    console.log('\n=== users 테이블 생성 문 ===');
    const [createTable] = await connection.query(`
      SHOW CREATE TABLE users
    `);
    console.log(createTable[0]['Create Table']);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

checkUsersTable();
