const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixInstructorTables() {
  let connection;

  try {
    console.log('🔌 MySQL 연결 중...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('✅ MySQL 연결 성공!\n');

    // 기존 테이블 삭제
    console.log('🗑️  기존 테이블 삭제 중...\n');
    
    await connection.execute('DROP TABLE IF EXISTS instructor_lectures');
    console.log('   ✅ instructor_lectures 테이블 삭제 완료');
    
    await connection.execute('DROP TABLE IF EXISTS instructors');
    console.log('   ✅ instructors 테이블 삭제 완료\n');

    // instructors 테이블 생성
    console.log('📋 instructors 테이블 생성 중...\n');
    
    await connection.execute(`
      CREATE TABLE instructors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '강사 이름',
        department VARCHAR(100) COMMENT '학과/부서',
        subject VARCHAR(200) COMMENT '담당 과목 (쉼표로 구분)',
        phone VARCHAR(20) COMMENT '연락처',
        email VARCHAR(100) COMMENT '이메일',
        hire_date DATE COMMENT '입사일',
        address TEXT COMMENT '주소',
        notes TEXT COMMENT '비고',
        salary DECIMAL(10,2) DEFAULT 0 COMMENT '급여',
        employment_type ENUM('full-time', 'part-time', 'contract') DEFAULT 'full-time' COMMENT '고용 형태',
        status ENUM('active', 'inactive', 'resigned') DEFAULT 'active' COMMENT '상태',
        profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강사 정보 테이블'
    `);

    console.log('✅ instructors 테이블 생성 완료!\n');

    // instructor_lectures 테이블 생성
    console.log('📋 instructor_lectures 테이블 생성 중...\n');
    
    await connection.execute(`
      CREATE TABLE instructor_lectures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        instructor_id INT NOT NULL COMMENT '강사 ID',
        lecture_id INT NOT NULL COMMENT '강의 ID',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

        INDEX idx_instructor (instructor_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_is_active (is_active),
        INDEX idx_instructor_lecture (instructor_id, lecture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강사-강의 연결 테이블'
    `);

    console.log('✅ instructor_lectures 테이블 생성 완료!\n');

    // 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입 중...\n');

    await connection.execute(`
      INSERT INTO instructors (name, department, subject, phone, email, hire_date, employment_type, status) 
      VALUES
      ('박선생', '수학부', '수학, 물리', '010-1111-1111', 'park@example.com', '2020-03-01', 'full-time', 'active'),
      ('김선생', '영어부', '영어', '010-2222-2222', 'kim@example.com', '2019-09-01', 'full-time', 'active'),
      ('이선생', '과학부', '과학, 생물', '010-3333-3333', 'lee@example.com', '2021-05-15', 'part-time', 'active')
    `);

    console.log('✅ 샘플 데이터 삽입 완료!\n');

    // 결과 확인
    console.log('📊 생성된 데이터 확인:\n');

    const [instructors] = await connection.execute('SELECT id, name, department, subject, phone, email, status FROM instructors');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 등록된 강사 목록:\n');
    instructors.forEach(instructor => {
      console.log(`   ${instructor.id}. ${instructor.name} (${instructor.department})`);
      console.log(`      📚 담당과목: ${instructor.subject}`);
      console.log(`      📞 연락처: ${instructor.phone}`);
      console.log(`      📧 이메일: ${instructor.email}`);
      console.log(`      📊 상태: ${instructor.status}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [relations] = await connection.execute('SELECT COUNT(*) as count FROM instructor_lectures');
    console.log(`✅ instructor_lectures 테이블: ${relations[0].count}개의 관계\n`);

    console.log('🎉 테이블 생성 완료!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 다음 단계:\n');
    console.log('   1. 백엔드 서버 재시작 (현재 터미널에서 Ctrl+C → npm start)');
    console.log('   2. 브라우저에서 강사 관리 페이지 새로고침 (F5)');
    console.log('   3. 3명의 강사가 목록에 표시되는지 확인!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('\n상세 정보:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL 연결 종료\n');
    }
  }
}

fixInstructorTables();
