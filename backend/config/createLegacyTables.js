const mysql = require('mysql2/promise');
require('dotenv').config();

// 기존 앱 호환용 추가 테이블 생성
const createAdditionalTables = async () => {
  let connection;

  try {
    // MySQL 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 기존 앱 호환용 추가 테이블 생성 시작...');

    // 1. 학생에 student_number 컬럼 추가 (없으면)
    try {
      await connection.query(`
        ALTER TABLE students 
        ADD COLUMN student_number VARCHAR(50) UNIQUE COMMENT '학생번호'
        AFTER id
      `);
      console.log('✅ students 테이블에 student_number 컬럼 추가');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('⚠️  student_number 컬럼 추가 중 오류:', error.message);
      } else {
        console.log('ℹ️  student_number 컬럼 이미 존재');
      }
    }

    // 2. 간단한 출석 로그 테이블 (기존 앱 호환용)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id BIGINT NOT NULL COMMENT '학생 ID',
        status INT NOT NULL DEFAULT 0 COMMENT '출석 상태 (0: 미출석, 1: 출석, 2: 지각, 3: 조퇴, 4: 결석)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_daily_attendance (student_id, DATE(created_at)),
        INDEX idx_student_date (student_id, created_at),
        INDEX idx_status (status),
        INDEX idx_date (created_at)
      ) COMMENT = '일일 출석 상태 로그 (기존 앱 호환용)'
    `);
    console.log('✅ attendance_logs 테이블 생성 완료');

    // 3. 기존 학생 데이터에 student_number 자동 생성
    const students = await connection.query('SELECT id FROM students WHERE student_number IS NULL');
    if (students[0].length > 0) {
      console.log(`📝 ${students[0].length}명의 학생에게 student_number 자동 할당 중...`);
      
      for (const student of students[0]) {
        const studentNumber = `STU${String(student.id).padStart(6, '0')}`;
        await connection.query(
          'UPDATE students SET student_number = ? WHERE id = ?',
          [studentNumber, student.id]
        );
      }
      console.log('✅ 모든 학생에게 student_number 할당 완료');
    }

    console.log('🎉 기존 앱 호환용 추가 테이블 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 추가 테이블 생성 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createAdditionalTables()
    .then(success => {
      if (success) {
        console.log('✅ 추가 테이블 생성 성공');
        process.exit(0);
      } else {
        console.log('❌ 추가 테이블 생성 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  createAdditionalTables
};
