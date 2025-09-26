const mysql = require('mysql2/promise');
require('dotenv').config();

// 테이블 생성 SQL
const createTables = async () => {
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

    console.log('📋 테이블 생성 시작...');

    // 1. 사용자 테이블
    await connection.query(`
      CREATE TABLE users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL COMMENT '사용자 아이디',
        password_hash VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
        name VARCHAR(100) NOT NULL COMMENT '사용자 이름',
        email VARCHAR(255) COMMENT '이메일 주소',
        role ENUM('admin', 'superadmin') DEFAULT 'admin' COMMENT '권한 (admin: 일반관리자, superadmin: 최고관리자)',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        last_login_at TIMESTAMP NULL COMMENT '마지막 로그인 시간',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_username (username),
        INDEX idx_role (role),
        INDEX idx_active (is_active)
      ) COMMENT = '시스템 사용자(관리자) 테이블'
    `);
    console.log('✅ users 테이블 생성 완료');

    // 2. 학생 테이블
    await connection.query(`
      CREATE TABLE students (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL COMMENT '학생 이름',
        school VARCHAR(100) COMMENT '학교명',
        grade VARCHAR(10) COMMENT '학년',
        department VARCHAR(50) COMMENT '학과/계열',
        phone VARCHAR(20) COMMENT '학생 연락처',
        parent_phone VARCHAR(20) NOT NULL COMMENT '학부모 연락처',
        email VARCHAR(255) COMMENT '이메일 주소',
        birth_date DATE COMMENT '생년월일',
        address TEXT COMMENT '주소',
        notes TEXT COMMENT '비고사항',
        class_fee INT DEFAULT 0 COMMENT '월 수강료 총액',
        payment_due_date DATE COMMENT '월 결제일',
        send_payment_notification BOOLEAN DEFAULT TRUE COMMENT '결제 안내 문자 발송 여부',
        profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
        auto_attendance_msg BOOLEAN DEFAULT TRUE COMMENT '등하원 자동 메시지 발송',
        auto_outing_msg BOOLEAN DEFAULT FALSE COMMENT '외출/복귀 자동 메시지 발송',
        auto_image_msg BOOLEAN DEFAULT FALSE COMMENT '이미지 포함 메시지 발송',
        auto_study_monitoring BOOLEAN DEFAULT FALSE COMMENT '학습관제 대상 여부',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_name (name),
        INDEX idx_parent_phone (parent_phone),
        INDEX idx_school_grade (school, grade),
        INDEX idx_active (is_active),
        INDEX idx_payment_due (payment_due_date)
      ) COMMENT = '학생 정보 테이블'
    `);
    console.log('✅ students 테이블 생성 완료');

    // 3. 강사 테이블
    await connection.query(`
      CREATE TABLE teachers (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL COMMENT '강사 이름',
        phone VARCHAR(20) NOT NULL COMMENT '연락처',
        email VARCHAR(255) COMMENT '이메일 주소',
        subjects TEXT NOT NULL COMMENT '담당 과목 (쉼표로 구분)',
        experience VARCHAR(50) COMMENT '경력',
        notes TEXT COMMENT '비고사항',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_active (is_active)
      ) COMMENT = '강사 정보 테이블'
    `);
    console.log('✅ teachers 테이블 생성 완료');

    // 4. 강의 테이블
    await connection.query(`
      CREATE TABLE lectures (
        id VARCHAR(50) PRIMARY KEY COMMENT '강의 고유 ID',
        name VARCHAR(200) NOT NULL COMMENT '강의명',
        teacher_name VARCHAR(100) NOT NULL COMMENT '담당 강사명',
        subject VARCHAR(100) NOT NULL COMMENT '과목',
        schedule VARCHAR(200) NOT NULL COMMENT '수업 일정',
        fee INT NOT NULL DEFAULT 0 COMMENT '월 수강료',
        capacity INT NOT NULL DEFAULT 10 COMMENT '정원',
        current_students INT DEFAULT 0 COMMENT '현재 수강생 수',
        description TEXT COMMENT '강의 설명',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_teacher (teacher_name),
        INDEX idx_subject (subject),
        INDEX idx_active (is_active),
        INDEX idx_fee (fee)
      ) COMMENT = '강의 정보 테이블'
    `);
    console.log('✅ lectures 테이블 생성 완료');

    // 5. 학생-강의 연결 테이블
    await connection.query(`
      CREATE TABLE student_lectures (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id BIGINT NOT NULL COMMENT '학생 ID',
        lecture_id VARCHAR(50) NOT NULL COMMENT '강의 ID',
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '수강 신청일',
        is_active BOOLEAN DEFAULT TRUE COMMENT '수강 중 여부',

        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, lecture_id),

        INDEX idx_student (student_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_active (is_active),
        INDEX idx_enrolled_at (enrolled_at)
      ) COMMENT = '학생-강의 수강 관계 테이블'
    `);
    console.log('✅ student_lectures 테이블 생성 완료');

    // 6. 출결 기록 테이블
    await connection.query(`
      CREATE TABLE attendance_records (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id BIGINT NOT NULL COMMENT '학생 ID',
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

    console.log('🎉 모든 테이블 생성 완료!');
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
  createTables()
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
  createTables
};