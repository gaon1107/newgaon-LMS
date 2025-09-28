const mysql = require('mysql2/promise');
require('dotenv').config();

// 학생 테이블에 출결번호 필드 추가
const addAttendanceNumber = async () => {
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

    console.log('📋 출결번호 필드 추가 시작...');

    // 출결번호 필드가 이미 존재하는지 확인
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'lms_system'
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME = 'attendance_number'
    `);

    if (columns.length > 0) {
      console.log('⚠️ 출결번호 필드가 이미 존재합니다.');
      return true;
    }

    // 출결번호 필드 추가
    await connection.query(`
      ALTER TABLE students
      ADD COLUMN attendance_number VARCHAR(4) UNIQUE COMMENT '4자리 출결번호'
      AFTER parent_phone
    `);

    // 인덱스 추가
    await connection.query(`
      ALTER TABLE students
      ADD INDEX idx_attendance_number (attendance_number)
    `);

    console.log('✅ 출결번호 필드 추가 완료');

    // 기존 학생들에게 자동으로 출결번호 생성
    const [students] = await connection.query(`
      SELECT id FROM students WHERE attendance_number IS NULL AND is_active = true
    `);

    if (students.length > 0) {
      console.log(`📝 ${students.length}명의 학생에게 출결번호 생성 중...`);

      for (const student of students) {
        let attendanceNumber;
        let isUnique = false;
        let attempts = 0;

        // 중복되지 않는 4자리 번호 생성
        while (!isUnique && attempts < 100) {
          attendanceNumber = Math.floor(1000 + Math.random() * 9000).toString();

          const [existing] = await connection.query(
            'SELECT id FROM students WHERE attendance_number = ?',
            [attendanceNumber]
          );

          if (existing.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (isUnique) {
          await connection.query(
            'UPDATE students SET attendance_number = ? WHERE id = ?',
            [attendanceNumber, student.id]
          );
        } else {
          console.warn(`⚠️ 학생 ID ${student.id}에 대한 고유 출결번호 생성 실패`);
        }
      }

      console.log('✅ 기존 학생 출결번호 생성 완료');
    }

    console.log('🎉 출결번호 필드 추가 및 설정 완료!');
    return true;

  } catch (error) {
    console.error('❌ 출결번호 필드 추가 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  addAttendanceNumber()
    .then(success => {
      if (success) {
        console.log('✅ 출결번호 필드 추가 성공');
        process.exit(0);
      } else {
        console.log('❌ 출결번호 필드 추가 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  addAttendanceNumber
};