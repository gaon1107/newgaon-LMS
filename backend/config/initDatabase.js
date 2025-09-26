const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터베이스 초기화 함수
const initializeDatabase = async () => {
  let connection;

  try {
    // MySQL 연결 (데이터베이스 없이)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    console.log('📋 데이터베이스 초기화 시작...');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '../../../database_schema_sql.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // SQL 명령어들을 분리 (세미콜론 기준)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.match(/^--.*/));

    console.log(`📝 ${sqlCommands.length}개의 SQL 명령어를 실행합니다...`);

    // 각 명령어 실행
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          await connection.query(command);
          console.log(`✅ 명령어 ${i + 1}/${sqlCommands.length} 실행 완료`);
        } catch (error) {
          if (error.code === 'ER_DB_CREATE_EXISTS') {
            console.log(`ℹ️  데이터베이스가 이미 존재합니다`);
          } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`ℹ️  테이블이 이미 존재합니다`);
          } else {
            console.error(`❌ 명령어 ${i + 1} 실행 실패:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('🎉 데이터베이스 초기화가 완료되었습니다!');

    // 테이블 목록 확인
    await connection.query('USE lms_system');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📊 생성된 테이블 목록:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    return true;

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('✅ 데이터베이스 초기화 성공');
        process.exit(0);
      } else {
        console.log('❌ 데이터베이스 초기화 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  initializeDatabase
};