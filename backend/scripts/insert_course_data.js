const mysql = require('mysql2/promise');
require('dotenv').config();

// 강사 및 강의 데이터 삽입
const insertCourseData = async () => {
  let connection;

  try {
    // MySQL 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 강사 및 강의 데이터 삽입 시작...');

    // 1. 기본 강사 데이터
    await connection.query(`
      INSERT INTO teachers (name, phone, email, subjects, experience, notes) VALUES
      ('박선생', '010-1111-1111', 'teacher1@example.com', '수학, 물리', '5년', '중고등학교 수학 전문'),
      ('김선생', '010-2222-2222', 'teacher2@example.com', '영어', '8년', '영어회화 및 문법 전문'),
      ('이선생', '010-3333-3333', 'teacher3@example.com', '과학', '3년', '과학 실험 전문'),
      ('최선생', '010-4444-4444', 'teacher4@example.com', '컴퓨터', '6년', '프로그래밍 기초')
    `);
    console.log('✅ 기본 강사 데이터 삽입 완료');

    // 2. 기본 강의 데이터
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

    // 3. student_lectures 테이블 생성 (빠진 테이블)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_lectures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        lecture_id VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, lecture_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ student_lectures 테이블 생성 완료');

    // 4. 학생-강의 연결 (김철수 -> 수학 A반, 이영희 -> 영어 B반)
    await connection.query(`
      INSERT INTO student_lectures (student_id, lecture_id) VALUES
      (1, 'math_a'),
      (2, 'english_b')
    `);
    console.log('✅ 학생-강의 연결 데이터 삽입 완료');

    // 5. 강의별 현재 학생 수 업데이트
    await connection.query(`
      UPDATE lectures SET current_students = (
        SELECT COUNT(*) FROM student_lectures
        WHERE lecture_id = lectures.id AND is_active = TRUE
      )
    `);
    console.log('✅ 강의별 학생 수 업데이트 완료');

    console.log('🎉 모든 강사 및 강의 데이터 삽입 완료!');

    // 삽입된 데이터 확인
    const [teachers] = await connection.query('SELECT name, subjects FROM teachers');
    const [lectures] = await connection.query('SELECT name, teacher_name, current_students FROM lectures');

    console.log('📊 삽입된 데이터 확인:');
    console.log('   👨‍🏫 강사:', teachers.map(t => `${t.name}(${t.subjects})`).join(', '));
    console.log('   📚 강의:', lectures.map(l => `${l.name}(${l.teacher_name}, ${l.current_students}명)`).join(', '));

    return true;

  } catch (error) {
    console.error('❌ 강사 및 강의 데이터 삽입 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  insertCourseData()
    .then(success => {
      if (success) {
        console.log('✅ 강사 및 강의 데이터 삽입 성공');
        process.exit(0);
      } else {
        console.log('❌ 강사 및 강의 데이터 삽입 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { insertCourseData };