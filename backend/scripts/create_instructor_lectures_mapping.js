const mysql = require('mysql2/promise');
require('dotenv').config();

async function createInstructorLecturesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 instructor_lectures 테이블 생성 중...');

    // instructor_lectures 테이블이 이미 있는지 확인
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'instructor_lectures'",
      [process.env.DB_NAME]
    );

    if (tables.length > 0) {
      console.log('✅ instructor_lectures 테이블이 이미 존재합니다.');
      console.log('🗑️  기존 테이블 삭제 중...');
      await connection.query('DROP TABLE IF EXISTS instructor_lectures');
    }

    // instructor_lectures 테이블 생성
    const createTableSQL = `
      CREATE TABLE instructor_lectures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        instructor_id INT NOT NULL,
        lecture_id VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        
        UNIQUE KEY unique_instructor_lecture (tenant_id, instructor_id, lecture_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
        
        INDEX idx_tenant_instructor (tenant_id, instructor_id),
        INDEX idx_tenant_lecture (tenant_id, lecture_id),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ instructor_lectures 테이블이 생성되었습니다.');

    // 기존 데이터 마이그레이션 (lectures.instructor_id → instructor_lectures)
    console.log('🔄 기존 강사 데이터 마이그레이션 중...');
    
    const migrateSQL = `
      INSERT IGNORE INTO instructor_lectures (tenant_id, instructor_id, lecture_id, is_active)
      SELECT 
        l.tenant_id,
        l.instructor_id,
        l.id,
        true
      FROM lectures l
      WHERE l.instructor_id IS NOT NULL AND l.is_active = true;
    `;

    const result = await connection.query(migrateSQL);
    console.log(`✅ ${result[0].affectedRows}개의 강사-강의 매핑이 마이그레이션되었습니다.`);

    console.log('\n✨ instructor_lectures 테이블 설정 완료!');

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createInstructorLecturesTable();
