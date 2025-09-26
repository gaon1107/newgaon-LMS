const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 초기 데이터 삽입
const insertInitialData = async () => {
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

    console.log('📋 초기 데이터 삽입 시작...');

    // 1. 관리자 계정 생성
    const adminPassword = await bcrypt.hash('admin123!', 12);
    
    try {
      await connection.query(`
        INSERT IGNORE INTO users (username, password_hash, name, email, role, is_active)
        VALUES 
        ('admin', ?, '관리자', 'admin@example.com', 'admin', TRUE),
        ('gfkids', ?, 'GFKids관리자', 'gfkids@newgaon.com', 'admin', TRUE)
      `, [adminPassword, adminPassword]);
      console.log('✅ 관리자 계정 생성 완료');
    } catch (error) {
      console.log('ℹ️  관리자 계정 이미 존재');
    }

    // 2. 테스트 학생 데이터 생성
    try {
      await connection.query(`
        INSERT IGNORE INTO students (student_number, name, school, grade, parent_phone, class_fee, is_active)
        VALUES 
        ('STU000001', '김철수', '새싹초등학교', '3학년', '010-1234-5678', 150000, TRUE),
        ('STU000002', '이영희', '푸른초등학교', '4학년', '010-2345-6789', 180000, TRUE),
        ('STU000003', '박민준', '햇빛초등학교', '5학년', '010-3456-7890', 200000, TRUE),
        ('STU000004', '최수정', '바람초등학교', '3학년', '010-4567-8901', 150000, TRUE),
        ('STU000005', '정우진', '새싹초등학교', '4학년', '010-5678-9012', 180000, TRUE)
      `);
      console.log('✅ 테스트 학생 데이터 생성 완료');
    } catch (error) {
      console.log('ℹ️  테스트 학생 데이터 이미 존재');
    }

    // 3. 강사 데이터 생성
    try {
      await connection.query(`
        INSERT IGNORE INTO teachers (name, phone, email, subjects, experience, is_active)
        VALUES 
        ('김선생', '010-1111-2222', 'kim@example.com', '수학, 과학', '5년', TRUE),
        ('이선생', '010-3333-4444', 'lee@example.com', '국어, 영어', '8년', TRUE),
        ('박선생', '010-5555-6666', 'park@example.com', '영어, 수학', '3년', TRUE)
      `);
      console.log('✅ 테스트 강사 데이터 생성 완료');
    } catch (error) {
      console.log('ℹ️  테스트 강사 데이터 이미 존재');
    }

    // 4. 강의 데이터 생성
    try {
      await connection.query(`
        INSERT IGNORE INTO lectures (id, name, teacher_name, subject, schedule, fee, capacity, description, is_active)
        VALUES 
        ('LEC001', '초등수학 3학년반', '김선생', '수학', '월수금 16:00-17:30', 120000, 15, '기초부터 탄탄하게!', TRUE),
        ('LEC002', '초등영어 기초반', '이선생', '영어', '화목 17:00-18:30', 100000, 12, '영어의 첫걸음', TRUE),
        ('LEC003', '초등과학 실험반', '김선생', '과학', '토 10:00-12:00', 150000, 10, '재미있는 과학실험', TRUE),
        ('LEC004', '초등국어 논술반', '이선생', '국어', '월목 18:00-19:30', 130000, 8, '생각하는 힘을 키우는 논술', TRUE)
      `);
      console.log('✅ 테스트 강의 데이터 생성 완료');
    } catch (error) {
      console.log('ℹ️  테스트 강의 데이터 이미 존재');
    }

    // 5. 학생-강의 연결 데이터 생성
    try {
      await connection.query(`
        INSERT IGNORE INTO student_lectures (student_id, lecture_id)
        VALUES 
        (1, 'LEC001'), (1, 'LEC002'),
        (2, 'LEC002'), (2, 'LEC004'),
        (3, 'LEC001'), (3, 'LEC003'),
        (4, 'LEC001'), (4, 'LEC002'),
        (5, 'LEC002'), (5, 'LEC004')
      `);
      console.log('✅ 테스트 수강 관계 데이터 생성 완료');
    } catch (error) {
      console.log('ℹ️  테스트 수강 관계 데이터 이미 존재');
    }

    console.log('🎉 초기 데이터 삽입 완료!');
    console.log('📝 기본 관리자 계정:');
    console.log('   - 아이디: admin, 비밀번호: admin123!');
    console.log('   - 아이디: gfkids, 비밀번호: admin123!');
    
    return true;

  } catch (error) {
    console.error('❌ 초기 데이터 삽입 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  insertInitialData()
    .then(success => {
      if (success) {
        console.log('✅ 초기 데이터 삽입 성공');
        process.exit(0);
      } else {
        console.log('❌ 초기 데이터 삽입 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  insertInitialData
};
