const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 전용 초기화 함수
const initializeMySQLOnly = async () => {
  console.log('🐬 MySQL 전용 데이터베이스 초기화 시작...');
  console.log('📋 SQLite는 완전히 비활성화됩니다.');
  
  let connection;

  try {
    // 1. 데이터베이스 없이 MySQL 연결
    console.log('🔗 MySQL 서버 연결 중...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });

    console.log('✅ MySQL 서버 연결 성공');

    // 2. 데이터베이스 생성 (존재하지 않는 경우)
    console.log('📦 데이터베이스 생성 중...');
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'lms_system'} 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log(`✅ 데이터베이스 '${process.env.DB_NAME || 'lms_system'}' 준비 완료`);

    // 3. 데이터베이스 선택
    await connection.query(`USE ${process.env.DB_NAME || 'lms_system'}`);

    // 4. 테이블 생성
    console.log('🏗️ 테이블 생성 중...');
    
    // Users 테이블 (기존 앱 호환)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role ENUM('admin', 'superadmin', 'teacher') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Students 테이블 (기존 앱 호환)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_number VARCHAR(20) UNIQUE,
        name VARCHAR(100) NOT NULL,
        school VARCHAR(100),
        grade VARCHAR(10),
        department VARCHAR(50),
        phone VARCHAR(20),
        parent_phone VARCHAR(20),
        email VARCHAR(100),
        birth_date DATE,
        address TEXT,
        notes TEXT,
        class_fee DECIMAL(10,2) DEFAULT 0,
        payment_due_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Attendance_logs 테이블 (기존 앱 호환)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        status TINYINT DEFAULT 0 COMMENT '0:미출석, 1:출석, 2:지각, 3:조퇴, 4:결석',
        check_in_time TIMESTAMP NULL,
        check_out_time TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_daily_attendance (student_id, DATE(created_at))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Teachers 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        subjects TEXT,
        experience VARCHAR(100),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Lectures 테이블
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lectures (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        teacher_name VARCHAR(100),
        subject VARCHAR(100),
        schedule VARCHAR(100),
        fee DECIMAL(10,2) DEFAULT 0,
        capacity INT DEFAULT 0,
        current_students INT DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ 모든 테이블 생성 완료');

    // 5. 기본 관리자 계정 생성
    console.log('👤 기본 관리자 계정 생성 중...');
    
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin', 10);
    const newgaonPassword = await bcrypt.hash('newgaon', 10);

    await connection.query(`
      INSERT IGNORE INTO users (username, password_hash, name, email, role) VALUES
      ('admin', ?, '관리자', 'admin@example.com', 'admin'),
      ('newgaon', ?, '뉴가온 슈퍼관리자', 'newgaon@example.com', 'superadmin')
    `, [adminPassword, newgaonPassword]);

    console.log('✅ 기본 관리자 계정 생성 완료');
    console.log('   📝 admin / admin (관리자)');
    console.log('   📝 newgaon / newgaon (슈퍼관리자)');

    // 6. 생성된 계정 확인
    const [users] = await connection.query('SELECT username, name, role FROM users');
    console.log('📊 생성된 계정 목록:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - ${user.role}`);
    });

    return true;

  } catch (error) {
    console.error('❌ MySQL 초기화 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 MySQL 연결 종료');
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  initializeMySQLOnly()
    .then(success => {
      if (success) {
        console.log('🎉 MySQL 전용 초기화 완료!');
        console.log('💡 이제 SQLite는 사용되지 않습니다.');
        process.exit(0);
      } else {
        console.log('❌ MySQL 초기화 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('초기화 오류:', error);
      process.exit(1);
    });
}

module.exports = { initializeMySQLOnly };
