const mysql = require('mysql2/promise');
require('dotenv').config();

// 새로운 테이블 생성
const createNewTables = async () => {
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

    console.log('📋 새로운 테이블 생성 시작...');

    // 외래키 체크 비활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. 기존 student_lectures의 외래키 제약조건 제거
    try {
      await connection.query('ALTER TABLE student_lectures DROP FOREIGN KEY student_lectures_ibfk_2');
      console.log('✅ student_lectures 외래키 제약조건 제거');
    } catch (error) {
      console.log('ℹ️ student_lectures 외래키 제약조건이 존재하지 않음');
    }

    // 2. lectures 테이블 생성
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

        INDEX idx_name (name),
        INDEX idx_subject (subject),
        INDEX idx_instructor (instructor_id),
        INDEX idx_status (status),
        INDEX idx_active (is_active),
        INDEX idx_schedule (start_date, end_date),
        INDEX idx_fee (fee)
      ) COMMENT = '강의 정보 테이블'
    `);
    console.log('✅ lectures 테이블 생성 완료');

    // 3. student_lectures 테이블의 lecture_id 컬럼 타입 변경
    await connection.query('ALTER TABLE student_lectures MODIFY lecture_id BIGINT NOT NULL COMMENT "강의 ID"');
    console.log('✅ student_lectures.lecture_id 타입 변경 완료');

    // 4. instructor_lectures 관계 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS instructor_lectures (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        instructor_id BIGINT NOT NULL COMMENT '강사 ID',
        lecture_id BIGINT NOT NULL COMMENT '강의 ID',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일시',
        is_active BOOLEAN DEFAULT TRUE COMMENT '배정 상태',

        INDEX idx_instructor (instructor_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_active (is_active),
        INDEX idx_assigned_at (assigned_at),
        UNIQUE KEY unique_assignment (instructor_id, lecture_id)
      ) COMMENT = '강사-강의 배정 관계 테이블'
    `);
    console.log('✅ instructor_lectures 테이블 생성 완료');

    // 외래키 체크 다시 활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 5. 외래키 제약조건 추가
    try {
      await connection.query('ALTER TABLE lectures ADD FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL');
      console.log('✅ lectures → instructors 외래키 추가');
    } catch (error) {
      console.log('⚠️ lectures 외래키 추가 실패:', error.message);
    }

    try {
      await connection.query('ALTER TABLE student_lectures ADD FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE');
      console.log('✅ student_lectures → lectures 외래키 추가');
    } catch (error) {
      console.log('⚠️ student_lectures 외래키 추가 실패:', error.message);
    }

    try {
      await connection.query('ALTER TABLE instructor_lectures ADD FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE');
      console.log('✅ instructor_lectures → instructors 외래키 추가');
    } catch (error) {
      console.log('⚠️ instructor_lectures → instructors 외래키 추가 실패:', error.message);
    }

    try {
      await connection.query('ALTER TABLE instructor_lectures ADD FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE');
      console.log('✅ instructor_lectures → lectures 외래키 추가');
    } catch (error) {
      console.log('⚠️ instructor_lectures → lectures 외래키 추가 실패:', error.message);
    }

    // 6. 샘플 데이터 추가
    console.log('📝 샘플 데이터 추가...');

    // 샘플 강사 데이터
    const sampleInstructors = [
      ['김영희', '수학과', '수학', '010-1234-5678', 'kim@example.com', '2023-01-01', '서울시 강남구', '수학 전문 강사', 3000000, 'full-time', 'active'],
      ['이철수', '영어과', '영어', '010-2345-6789', 'lee@example.com', '2023-02-01', '서울시 서초구', '영어 회화 전문', 2800000, 'full-time', 'active'],
      ['박민수', '과학과', '물리', '010-3456-7890', 'park@example.com', '2023-03-01', '서울시 송파구', '물리학 박사', 3200000, 'part-time', 'active']
    ];

    for (const instructor of sampleInstructors) {
      try {
        await connection.query(`
          INSERT IGNORE INTO instructors (name, department, subject, phone, email, hire_date, address, notes, salary, employment_type, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, instructor);
      } catch (error) {
        console.log('⚠️ 강사 샘플 데이터 추가 실패:', error.message);
      }
    }
    console.log('✅ 샘플 강사 데이터 추가 완료');

    // 샘플 강의 데이터
    const sampleLectures = [
      ['고등수학 심화반', '수학', '고등학교 수학 심화 과정', 1, '월수금 19:00-21:00', '2024-03-01', '2024-08-31', 300000, 15, 0, 'A101', 'active', '고등학생 대상 수학 심화'],
      ['영어회화 기초반', '영어', '영어 회화 기초 과정', 2, '화목 18:00-20:00', '2024-03-01', '2024-08-31', 250000, 12, 0, 'B201', 'active', '영어 회화 입문자 대상'],
      ['물리학 개념반', '물리', '고등물리 개념 정리', 3, '토 14:00-18:00', '2024-03-01', '2024-08-31', 400000, 10, 0, 'C301', 'active', '물리학 개념 완성']
    ];

    for (const lecture of sampleLectures) {
      try {
        await connection.query(`
          INSERT IGNORE INTO lectures (name, subject, description, instructor_id, schedule, start_date, end_date, fee, max_students, current_students, room, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, lecture);
      } catch (error) {
        console.log('⚠️ 강의 샘플 데이터 추가 실패:', error.message);
      }
    }
    console.log('✅ 샘플 강의 데이터 추가 완료');

    // 강사-강의 관계 설정
    const assignments = [
      [1, 1], [2, 2], [3, 3]
    ];

    for (const assignment of assignments) {
      try {
        await connection.query(`
          INSERT IGNORE INTO instructor_lectures (instructor_id, lecture_id)
          VALUES (?, ?)
        `, assignment);
      } catch (error) {
        console.log('⚠️ 강사-강의 관계 데이터 추가 실패:', error.message);
      }
    }
    console.log('✅ 강사-강의 관계 데이터 추가 완료');

    console.log('🎉 모든 테이블 생성 및 샘플 데이터 추가 완료!');
    return true;

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createNewTables()
    .then(success => {
      if (success) {
        console.log('✅ 테이블 생성 성공');
        process.exit(0);
      } else {
        console.log('❌ 테이블 생성 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  createNewTables
};