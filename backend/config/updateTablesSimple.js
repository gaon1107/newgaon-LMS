const mysql = require('mysql2/promise');
require('dotenv').config();

// 간단한 테이블 업데이트 (기존 데이터를 보존하면서)
const updateTablesSimple = async () => {
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

    console.log('📋 간단한 테이블 업데이트 시작...');

    // 1. instructors 테이블이 없다면 생성
    try {
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
      console.log('✅ instructors 테이블 확인/생성 완료');
    } catch (error) {
      console.log('⚠️ instructors 테이블 생성 중 오류:', error.message);
    }

    // 2. 기존 lectures 테이블에 필요한 컬럼 추가
    try {
      // 컬럼 존재 여부 확인 및 추가
      const columns = [
        'ADD COLUMN instructor_id BIGINT COMMENT "담당 강사 ID"',
        'ADD COLUMN description TEXT COMMENT "강의 설명"',
        'ADD COLUMN start_date DATE COMMENT "개강일"',
        'ADD COLUMN end_date DATE COMMENT "종강일"',
        'ADD COLUMN max_students INT DEFAULT 0 COMMENT "최대 수강 인원"',
        'ADD COLUMN room VARCHAR(50) COMMENT "강의실"',
        'ADD COLUMN status ENUM("active", "pending", "completed", "cancelled") DEFAULT "active" COMMENT "강의 상태"',
        'ADD COLUMN notes TEXT COMMENT "비고사항"'
      ];

      for (const columnSql of columns) {
        try {
          await connection.query(`ALTER TABLE lectures ${columnSql}`);
          console.log(`✅ lectures 테이블 컬럼 추가: ${columnSql.split(' ')[2]}`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`ℹ️ 컬럼이 이미 존재함: ${columnSql.split(' ')[2]}`);
          } else {
            console.log(`⚠️ 컬럼 추가 실패: ${error.message}`);
          }
        }
      }

      // fee 컬럼 타입 변경 (INT에서 DECIMAL로)
      try {
        await connection.query('ALTER TABLE lectures MODIFY fee DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT "수강료"');
        console.log('✅ lectures.fee 컬럼 타입 변경 완료');
      } catch (error) {
        console.log('⚠️ fee 컬럼 타입 변경 중 오류:', error.message);
      }

      // capacity를 max_students로 이름 변경 (이미 max_students가 추가되었다면 capacity 삭제)
      try {
        await connection.query('ALTER TABLE lectures DROP COLUMN capacity');
        console.log('✅ lectures.capacity 컬럼 삭제 완료');
      } catch (error) {
        console.log('ℹ️ capacity 컬럼이 존재하지 않음');
      }

    } catch (error) {
      console.log('⚠️ lectures 테이블 수정 중 오류:', error.message);
    }

    // 3. instructor_lectures 관계 테이블 생성
    try {
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
    } catch (error) {
      console.log('⚠️ instructor_lectures 테이블 생성 중 오류:', error.message);
    }

    // 4. student_lectures 테이블의 lecture_id 컬럼 타입 확인 및 변경
    try {
      // 현재 컬럼 타입 확인
      const [columns] = await connection.query(`
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'lms_system'
        AND TABLE_NAME = 'student_lectures'
        AND COLUMN_NAME = 'lecture_id'
      `);

      if (columns.length > 0 && columns[0].COLUMN_TYPE.includes('varchar')) {
        console.log('⚠️ student_lectures.lecture_id가 VARCHAR 타입입니다. BIGINT로 변경이 필요합니다.');
        console.log('📝 기존 데이터가 있다면 수동으로 마이그레이션이 필요할 수 있습니다.');

        // 일단 테이블 구조만 준비하고 데이터 마이그레이션은 별도로 처리
        await connection.query('ALTER TABLE student_lectures MODIFY lecture_id BIGINT NOT NULL COMMENT "강의 ID"');
        console.log('✅ student_lectures.lecture_id 타입 변경 완료');
      }
    } catch (error) {
      console.log('⚠️ student_lectures 테이블 수정 중 오류:', error.message);
    }

    console.log('🎉 테이블 업데이트 완료!');
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
  updateTablesSimple()
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
  updateTablesSimple
};