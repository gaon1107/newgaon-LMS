const mysql = require('mysql2/promise');
require('dotenv').config();

// 간단한 출결 테이블 생성 (대시보드용)
const createAttendanceSimpleTable = async () => {
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

    console.log('📋 대시보드용 출결 테이블 생성 시작...');

    // attendance 테이블이 이미 존재하는지 확인
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'attendance'
    `);

    if (tables.length > 0) {
      console.log('⚠️ attendance 테이블이 이미 존재합니다.');
      return true;
    }

    // 출결 테이블 생성
    await connection.query(`
      CREATE TABLE attendance (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL COMMENT '학생 ID',
        lecture_id INT NOT NULL COMMENT '강의 ID',
        date DATE NOT NULL COMMENT '출석 날짜',
        status VARCHAR(20) NOT NULL COMMENT '출석 상태 (present, absent, late, early_leave, out, returned, left)',
        check_in_time TIME NULL COMMENT '등원 시간',
        check_out_time TIME NULL COMMENT '하원 시간',
        notes TEXT NULL COMMENT '비고',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,

        UNIQUE KEY unique_attendance (student_id, lecture_id, date),
        INDEX idx_date (date),
        INDEX idx_student (student_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='출석 관리 테이블 (대시보드용)'
    `);

    console.log('✅ attendance 테이블 생성 완료');
    console.log('');
    console.log('📊 테이블 구조:');
    console.log('  - student_id: 학생 ID');
    console.log('  - lecture_id: 강의 ID');
    console.log('  - date: 출석 날짜');
    console.log('  - status: 출석 상태 (present, absent, late, early_leave, out, returned, left)');
    console.log('  - check_in_time: 등원 시간');
    console.log('  - check_out_time: 하원 시간');
    console.log('  - notes: 비고');
    console.log('');
    console.log('🎉 대시보드용 출결 테이블 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 출결 테이블 생성 실패:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.error('');
      console.error('💡 힌트: lectures 테이블에 최소 1개의 강의가 있어야 합니다!');
      console.error('        먼저 강의를 등록한 후 다시 시도하세요.');
    }
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createAttendanceSimpleTable()
    .then(success => {
      if (success) {
        console.log('');
        console.log('✅ 출결 테이블 생성 성공');
        console.log('');
        console.log('📝 다음 단계:');
        console.log('  1. 백엔드 서버 재시작 (Ctrl+C → npm start)');
        console.log('  2. 웹 새로고침 (Ctrl+Shift+R)');
        console.log('  3. 대시보드에서 출결 변경 테스트');
        console.log('');
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
  createAttendanceSimpleTable
};
