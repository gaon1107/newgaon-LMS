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

    // 1. 관리자 계정 생성 (비밀번호 해싱)
    const adminPassword = await bcrypt.hash('admin', 10);
    const newgaonPassword = await bcrypt.hash('newgaon', 10);

    await connection.query(`
      INSERT INTO users (username, password_hash, name, email, role) VALUES
      ('admin', ?, '관리자', 'admin@example.com', 'admin'),
      ('newgaon', ?, '뉴가온 슈퍼관리자', 'newgaon@example.com', 'superadmin')
    `, [adminPassword, newgaonPassword]);
    console.log('✅ 관리자 계정 생성 완료');

    // 2. 기본 강사 데이터
    await connection.query(`
      INSERT INTO teachers (name, phone, email, subjects, experience, notes) VALUES
      ('박선생', '010-1111-1111', 'teacher1@example.com', '수학, 물리', '5년', '중고등학교 수학 전문'),
      ('김선생', '010-2222-2222', 'teacher2@example.com', '영어', '8년', '영어회화 및 문법 전문'),
      ('이선생', '010-3333-3333', 'teacher3@example.com', '과학', '3년', '과학 실험 전문'),
      ('최선생', '010-4444-4444', 'teacher4@example.com', '컴퓨터', '6년', '프로그래밍 기초')
    `);
    console.log('✅ 기본 강사 데이터 삽입 완료');

    // 3. 기본 강의 데이터
    await connection.query(`
      INSERT INTO lectures (id, name, teacher_name, subject, schedule, fee, capacity, description) VALUES
      ('math_a', '수학 A반', '박선생', '수학', '월,수,금 19:00-20:30', 150000, 20, '중학교 1-2학년 대상 기초 수학'),
      ('math_b', '수학 B반', '박선생', '수학', '화,목 18:00-19:30', 120000, 15, '중학교 3학년 대상 수학'),
      ('english_a', '영어 A반', '김선생', '영어', '월,수,금 20:00-21:30', 130000, 18, '고등학교 영어 문법 및 독해'),
      ('english_b', '영어 B반', '김선생', '영어', '화,목 19:00-20:30', 110000, 15, '중학교 영어 기초 과정'),
      ('science', '과학 C반', '이선생', '과학', '토 10:00-12:00', 140000, 12, '중고등학교 과학 실험 수업'),
      ('coding', '코딩반', '최선생', '컴퓨터', '토 14:00-16:00', 180000, 10, '초보자를 위한 프로그래밍 기초')
    `);
    console.log('✅ 기본 강의 데이터 삽입 완료');

    // 4. 기본 학생 데이터 (예시)
    await connection.query(`
      INSERT INTO students (name, school, grade, department, phone, parent_phone, email, birth_date, address, notes, class_fee, payment_due_date) VALUES
      ('김철수', '가온 중학교', '3', '수학과', '010-1111-2222', '010-9999-8888', 'parent1@example.com', '2010-03-15', '서울시 강남구', '수학에 관심이 많음', 150000, '2025-01-25'),
      ('이영희', '가온 고등학교', '1', '영어과', '010-2222-3333', '010-8888-7777', 'parent2@example.com', '2011-07-22', '서울시 서초구', '영어 회화 실력 우수', 110000, '2025-01-30')
    `);
    console.log('✅ 기본 학생 데이터 삽입 완료');

    // 5. 학생-강의 연결 (김철수 -> 수학 A반, 이영희 -> 영어 B반)
    await connection.query(`
      INSERT INTO student_lectures (student_id, lecture_id) VALUES
      (1, 'math_a'),
      (2, 'english_b')
    `);
    console.log('✅ 학생-강의 연결 데이터 삽입 완료');

    // 6. 강의별 현재 학생 수 업데이트
    await connection.query(`
      UPDATE lectures SET current_students = (
        SELECT COUNT(*) FROM student_lectures
        WHERE lecture_id = lectures.id AND is_active = TRUE
      )
    `);
    console.log('✅ 강의별 학생 수 업데이트 완료');

    console.log('🎉 모든 초기 데이터 삽입 완료!');

    // 삽입된 데이터 확인
    const [users] = await connection.query('SELECT username, name, role FROM users');
    const [teachers] = await connection.query('SELECT name, subjects FROM teachers');
    const [lectures] = await connection.query('SELECT name, teacher_name, current_students FROM lectures');
    const [students] = await connection.query('SELECT name, school, grade FROM students');

    console.log('📊 삽입된 데이터 확인:');
    console.log('   👥 관리자:', users.map(u => `${u.name}(${u.username})`).join(', '));
    console.log('   👨‍🏫 강사:', teachers.map(t => `${t.name}(${t.subjects})`).join(', '));
    console.log('   📚 강의:', lectures.map(l => `${l.name}(${l.teacher_name}, ${l.current_students}명)`).join(', '));
    console.log('   👨‍🎓 학생:', students.map(s => `${s.name}(${s.school} ${s.grade})`).join(', '));

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