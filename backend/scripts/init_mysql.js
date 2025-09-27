const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MySQL 데이터베이스 초기화
const initializeMySQL = async () => {
  let connection;

  try {
    console.log('🔧 MySQL 데이터베이스 초기화 시작...');

    // 먼저 데이터베이스 없이 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    // 데이터베이스 생성
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'lms_system'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 데이터베이스 생성 완료');

    // 데이터베이스 선택
    await connection.query(`USE ${process.env.DB_NAME || 'lms_system'}`);

    // 테이블 생성
    console.log('📋 테이블 생성 중...');

    // 1. 사용자 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        role ENUM('admin', 'superadmin', 'instructor', 'student') DEFAULT 'instructor',
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ users 테이블 생성 완료');

    // 2. 학생 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        school VARCHAR(100),
        grade VARCHAR(20),
        department VARCHAR(100),
        phone VARCHAR(20),
        parent_phone VARCHAR(20),
        email VARCHAR(100),
        birth_date DATE,
        address TEXT,
        notes TEXT,
        class_fee DECIMAL(10,2),
        payment_due_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ students 테이블 생성 완료');

    // 3. 출석 로그 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        status TINYINT DEFAULT 0 COMMENT '0:등원, 1:하원, 2:외출, 3:복귀, 4:조퇴',
        attendance_date DATE DEFAULT (CURDATE()),
        attendance_time TIME DEFAULT (CURTIME()),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ attendance_logs 테이블 생성 완료');

    // 4. 강사 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        subjects TEXT,
        experience VARCHAR(200),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ teachers 테이블 생성 완료');

    // 5. 강의 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lectures (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        teacher_name VARCHAR(100),
        subject VARCHAR(100),
        schedule VARCHAR(200),
        fee DECIMAL(10,2),
        capacity INT DEFAULT 0,
        current_students INT DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ lectures 테이블 생성 완료');

    // 관리자 계정 생성
    console.log('👤 관리자 계정 생성 중...');

    // 기존 계정 확인
    const [existingUsers] = await connection.query('SELECT username FROM users WHERE username IN (?, ?)', ['admin', 'newgaon']);
    const existingUsernames = existingUsers.map(user => user.username);

    // admin 계정 생성
    if (!existingUsernames.includes('admin')) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, password_hash, name, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', adminPassword, '관리자', 'admin@example.com', 'admin', true]
      );
      console.log('✅ admin/admin123 계정 생성 완료');
    } else {
      console.log('ℹ️  admin 계정이 이미 존재합니다');
    }

    // newgaon 계정 생성
    if (!existingUsernames.includes('newgaon')) {
      const newgaonPassword = await bcrypt.hash('newgaon', 10);
      await connection.query(
        'INSERT INTO users (username, password_hash, name, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['newgaon', newgaonPassword, '뉴가온 관리자', 'newgaon@example.com', 'superadmin', true]
      );
      console.log('✅ newgaon/newgaon 계정 생성 완료');
    } else {
      console.log('ℹ️  newgaon 계정이 이미 존재합니다');
    }

    // 테스트 학생 데이터 생성
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    if (studentCount[0].count === 0) {
      console.log('👨‍🎓 테스트 학생 데이터 생성 중...');
      
      await connection.query(`
        INSERT INTO students (student_number, name, school, grade, parent_phone, is_active) VALUES
        ('STU001', '김철수', '가온중학교', '3학년', '010-1111-2222', true),
        ('STU002', '이영희', '가온고등학교', '1학년', '010-2222-3333', true),
        ('STU003', '박민수', '새빛중학교', '2학년', '010-3333-4444', true)
      `);
      console.log('✅ 테스트 학생 데이터 생성 완료');
    } else {
      console.log('ℹ️  학생 데이터가 이미 존재합니다');
    }

    console.log('🎉 MySQL 데이터베이스 초기화 완료!');

    // 생성된 데이터 확인
    const [users] = await connection.query('SELECT username, name, role FROM users');
    const [students] = await connection.query('SELECT student_number, name, school FROM students');

    console.log('📊 생성된 데이터:');
    console.log('   👥 사용자:', users.map(u => `${u.name}(${u.username})`).join(', '));
    console.log('   👨‍🎓 학생:', students.map(s => `${s.name}(${s.student_number})`).join(', '));

    return true;

  } catch (error) {
    console.error('❌ MySQL 초기화 실패:', error.message);
    console.error('💡 확인사항:');
    console.error('   1. MySQL 서비스가 실행 중인지 확인');
    console.error('   2. .env 파일의 DB_PASSWORD가 정확한지 확인');
    console.error('   3. MySQL root 계정 접근 권한 확인');
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행
if (require.main === module) {
  initializeMySQL()
    .then(success => {
      if (success) {
        console.log('✅ MySQL 초기화 성공');
        process.exit(0);
      } else {
        console.log('❌ MySQL 초기화 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { initializeMySQL };
