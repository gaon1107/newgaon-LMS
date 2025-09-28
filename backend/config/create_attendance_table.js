const mysql = require('mysql2/promise');
require('dotenv').config();

// 출결 테이블 생성
const createAttendanceTable = async () => {
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

    console.log('📋 출결 테이블 생성 시작...');

    // 출결 테이블이 이미 존재하는지 확인
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'attendance_records'
    `);

    if (tables.length > 0) {
      console.log('⚠️ attendance_records 테이블이 이미 존재합니다.');
      return true;
    }

    // 출결 기록 테이블 생성
    await connection.query(`
      CREATE TABLE attendance_records (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL COMMENT '학생 ID',
        student_name VARCHAR(100) NOT NULL COMMENT '학생 이름 (검색 최적화용)',
        class_name VARCHAR(200) COMMENT '반 이름',
        state_description VARCHAR(50) NOT NULL COMMENT '출결 상태 (등원, 하원, 외출, 복귀, 조퇴)',
        tagged_at TIMESTAMP NOT NULL COMMENT '태그된 시간',
        is_keypad BOOLEAN NULL COMMENT '입력 방식 (NULL: 직접입력, TRUE: 키패드, FALSE: 영상인식)',
        is_forced BOOLEAN DEFAULT FALSE COMMENT '강제 입력 여부',
        device_id VARCHAR(100) COMMENT '장치 ID',
        comment TEXT COMMENT '참고사항',
        thumbnail_data LONGTEXT COMMENT '썸네일 이미지 데이터 (Base64)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 생성일시',

        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

        INDEX idx_student_date (student_id, tagged_at),
        INDEX idx_tagged_at (tagged_at),
        INDEX idx_state (state_description),
        INDEX idx_student_name (student_name),
        INDEX idx_device (device_id),
        INDEX idx_date_state (tagged_at, state_description)
      ) COMMENT = '출결 기록 테이블'
    `);

    console.log('✅ attendance_records 테이블 생성 완료');
    console.log('🎉 출결 테이블 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 출결 테이블 생성 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createAttendanceTable()
    .then(success => {
      if (success) {
        console.log('✅ 출결 테이블 생성 성공');
        process.exit(0);
      } else {
        console.log('❌ 출결 테이블 생성 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  createAttendanceTable
};