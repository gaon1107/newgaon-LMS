const mysql = require('mysql2/promise');
require('dotenv').config();

// 테이블 업데이트 SQL (기존 테이블 구조 개선)
const updateTables = async () => {
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

    console.log('📋 테이블 업데이트 시작...');

    // 1. 기존 teachers 테이블 삭제하고 새로운 instructors 테이블 생성
    try {
      await connection.query('DROP TABLE IF EXISTS teachers');
      console.log('✅ 기존 teachers 테이블 삭제');
    } catch (error) {
      console.log('ℹ️ teachers 테이블이 존재하지 않음');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS instructors (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL COMMENT '강사 이름',
        department VARCHAR(100) COMMENT '소속 학과/부서',
        subject VARCHAR(100) COMMENT '전공/담당 과목',
        phone VARCHAR(20) COMMENT '연락처',
        email VARCHAR(255) COMMENT '이메일 주소',
        hire_date DATE COMMENT '채용일',
        address TEXT COMMENT '주소',
        notes TEXT COMMENT '비고사항',
        salary DECIMAL(10,2) DEFAULT 0 COMMENT '급여',
        employment_type ENUM('full-time', 'part-time', 'contract') DEFAULT 'full-time' COMMENT '고용 형태',
        status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active' COMMENT '근무 상태',
        profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_name (name),
        INDEX idx_department (department),
        INDEX idx_subject (subject),
        INDEX idx_phone (phone),
        INDEX idx_status (status),
        INDEX idx_active (is_active)
      ) COMMENT = '강사 정보 테이블'
    `);
    console.log('✅ instructors 테이블 생성 완료');

    // 2. 기존 lectures 테이블 구조 변경
    // 우선 백업용 테이블 생성
    try {
      await connection.query('DROP TABLE IF EXISTS lectures_backup');
      await connection.query('CREATE TABLE lectures_backup AS SELECT * FROM lectures');
      console.log('✅ lectures 테이블 백업 완료');
    } catch (error) {
      console.log('ℹ️ lectures 테이블 백업 실패 또는 테이블이 존재하지 않음');
    }

    // 기존 lectures 테이블 삭제하고 새로 생성
    try {
      // 먼저 외래키 제약조건이 있는 테이블들 확인하고 처리
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS lectures');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      console.log('ℹ️ lectures 테이블 삭제 중 오류:', error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lectures (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL COMMENT '강의명',
        subject VARCHAR(100) COMMENT '과목',
        description TEXT COMMENT '강의 설명',
        instructor_id BIGINT COMMENT '담당 강사 ID',
        schedule VARCHAR(200) COMMENT '수업 일정',
        start_date DATE COMMENT '개강일',
        end_date DATE COMMENT '종강일',
        fee DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '수강료',
        max_students INT DEFAULT 0 COMMENT '최대 수강 인원',
        current_students INT DEFAULT 0 COMMENT '현재 수강생 수',
        room VARCHAR(50) COMMENT '강의실',
        status ENUM('active', 'pending', 'completed', 'cancelled') DEFAULT 'active' COMMENT '강의 상태',
        notes TEXT COMMENT '비고사항',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,

        INDEX idx_name (name),
        INDEX idx_subject (subject),
        INDEX idx_instructor (instructor_id),
        INDEX idx_status (status),
        INDEX idx_active (is_active),
        INDEX idx_schedule (start_date, end_date),
        INDEX idx_fee (fee)
      ) COMMENT = '강의 정보 테이블'
    `);
    console.log('✅ lectures 테이블 재생성 완료');

    // 3. 강사-강의 관계 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS instructor_lectures (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        instructor_id BIGINT NOT NULL COMMENT '강사 ID',
        lecture_id BIGINT NOT NULL COMMENT '강의 ID',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일시',
        is_active BOOLEAN DEFAULT TRUE COMMENT '배정 상태',

        FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (instructor_id, lecture_id),

        INDEX idx_instructor (instructor_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_active (is_active),
        INDEX idx_assigned_at (assigned_at)
      ) COMMENT = '강사-강의 배정 관계 테이블'
    `);
    console.log('✅ instructor_lectures 테이블 생성 완료');

    // 4. 기존 student_lectures 테이블의 외래키 제약조건 업데이트
    try {
      // 기존 외래키 제약조건 삭제
      await connection.query('ALTER TABLE student_lectures DROP FOREIGN KEY student_lectures_ibfk_2');
    } catch (error) {
      console.log('ℹ️ 기존 student_lectures 외래키 제약조건이 존재하지 않음');
    }

    // lecture_id 컬럼 타입 변경 (VARCHAR에서 BIGINT로)
    await connection.query('ALTER TABLE student_lectures MODIFY lecture_id BIGINT NOT NULL COMMENT "강의 ID"');

    // 새로운 외래키 제약조건 추가
    await connection.query('ALTER TABLE student_lectures ADD FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE');
    console.log('✅ student_lectures 테이블 외래키 업데이트 완료');

    console.log('🎉 모든 테이블 업데이트 완료!');
    return true;

  } catch (error) {
    console.error('❌ 테이블 업데이트 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  updateTables()
    .then(success => {
      if (success) {
        console.log('✅ 테이블 업데이트 성공');
        process.exit(0);
      } else {
        console.log('❌ 테이블 업데이트 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  updateTables
};