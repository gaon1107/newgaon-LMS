const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// SQLite 데이터베이스 연결
const db = new Database(dbPath);

// WAL 모드 설정 (성능 향상)
db.pragma('journal_mode = WAL');

// 초기 테이블 생성
const initDatabase = () => {
  try {
    // 사용자 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'instructor',
        is_active BOOLEAN DEFAULT 1,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 학생 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        parent_phone TEXT,
        email TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 출석 로그 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
      )
    `);

    // 기본 관리자 계정 생성
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 10);

    const checkAdmin = db.prepare('SELECT id FROM users WHERE username = ?');
    if (!checkAdmin.get('admin')) {
      const insertAdmin = db.prepare(`
        INSERT INTO users (username, password_hash, name, email, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertAdmin.run('admin', adminPassword, '관리자', 'admin@example.com', 'admin', 1);
      console.log('✅ 기본 관리자 계정 생성됨 (admin/admin123)');
    }

    // 테스트 학생 데이터 생성
    const checkStudents = db.prepare('SELECT COUNT(*) as count FROM students');
    if (checkStudents.get().count === 0) {
      const insertStudent = db.prepare(`
        INSERT INTO students (student_number, name, parent_phone, is_active)
        VALUES (?, ?, ?, ?)
      `);

      insertStudent.run('STU001', '김철수', '010-1234-5678', 1);
      insertStudent.run('STU002', '이영희', '010-2345-6789', 1);
      insertStudent.run('STU003', '박민수', '010-3456-7890', 1);
      console.log('✅ 테스트 학생 데이터 생성됨');
    }

    console.log('✅ SQLite 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  }
};

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    db.prepare('SELECT 1').get();
    console.log('✅ SQLite 데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ SQLite 데이터베이스 연결 실패:', error.message);
    return false;
  }
};

// 쿼리 실행 헬퍼 함수 (MySQL 호환)
const query = async (sql, params = []) => {
  try {
    // MySQL -> SQLite 쿼리 변환
    let sqliteQuery = sql
      .replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP')
      .replace(/\?/g, '?')
      .replace(/LIMIT \?, \?/g, 'LIMIT ? OFFSET ?');

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sqliteQuery);
      const result = stmt.all(...params);
      return result || [];
    } else if (sql.trim().toUpperCase().startsWith('INSERT') ||
               sql.trim().toUpperCase().startsWith('UPDATE') ||
               sql.trim().toUpperCase().startsWith('DELETE')) {
      const stmt = db.prepare(sqliteQuery);
      const result = stmt.run(...params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    } else {
      const stmt = db.prepare(sqliteQuery);
      const result = stmt.run(...params);
      return result;
    }
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// 트랜잭션 실행 헬퍼 함수
const transaction = async (callback) => {
  const trans = db.transaction(() => {
    return callback({
      execute: (sql, params) => {
        const stmt = db.prepare(sql);
        return [stmt.all(...params)];
      }
    });
  });

  try {
    return trans();
  } catch (error) {
    throw error;
  }
};

// 데이터베이스 초기화
initDatabase();

module.exports = {
  db,
  query,
  transaction,
  testConnection
};