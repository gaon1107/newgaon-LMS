/**
 * 🎯 출결(Attendance) 테이블 생성 스크립트 (수정 버전)
 * 
 * ✅ 데이터베이스 구조에 맞게 수정됨
 * ✅ lectures ID는 varchar(50)로 설정
 * ✅ 필요한 컬럼 모두 추가
 * 
 * 실행: node create_attendance_table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAttendanceTable() {
  let connection;
  
  try {
    console.log('');
    console.log('🎯 ==========================================');
    console.log('🎯  출결(Attendance) 테이블 생성');
    console.log('🎯  (수정된 버전 - 호환성 완벽!)');
    console.log('🎯 ==========================================');
    console.log('');
    
    console.log('🔄 MySQL 연결 중...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });
    
    console.log('✅ MySQL 연결 성공!');
    console.log('');
    
    // ========================================
    // 1. attendance 테이블이 있는지 확인
    // ========================================
    console.log('📋 attendance 테이블 확인 중...');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance'
    `, [process.env.DB_NAME || 'lms_system']);
    
    if (tables.length > 0) {
      console.log('⚠️  attendance 테이블이 이미 존재합니다!');
      console.log('   삭제 후 새로 만들겠습니다...');
      console.log('');
      
      // 기존 테이블 삭제
      await connection.execute(`DROP TABLE IF EXISTS attendance`);
      console.log('✅ 기존 테이블 삭제 완료');
      console.log('');
    }
    
    // ========================================
    // 2. attendance 테이블 생성
    // ========================================
    console.log('🔧 attendance 테이블 생성 중...');
    console.log('');
    
    await connection.execute(`
      CREATE TABLE attendance (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '출결 ID',
        tenant_id VARCHAR(100) NOT NULL COMMENT '학원 ID',
        student_id INT NOT NULL COMMENT '학생 ID',
        lecture_id VARCHAR(50) NOT NULL COMMENT '강의 ID (텍스트)',
        date DATE NOT NULL COMMENT '출결 날짜',
        status ENUM('present', 'absent', 'late', 'early_leave', 'out', 'returned', 'left') 
          DEFAULT 'present' COMMENT '출결 상태',
        check_in_time TIME DEFAULT NULL COMMENT '입실 시간',
        check_out_time TIME DEFAULT NULL COMMENT '퇴실 시간',
        notes TEXT COMMENT '비고',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
        
        -- 🔑 고유 제약: 같은 학생이 같은 강의에서 같은 날 중복 불가
        UNIQUE KEY unique_attendance (tenant_id, student_id, lecture_id, date),
        
        -- 📑 인덱스: 빠른 검색용
        KEY idx_student (student_id),
        KEY idx_lecture (lecture_id),
        KEY idx_date (date),
        KEY idx_tenant (tenant_id),
        
        -- 🔗 외래키: 관계 설정 (student_id와 lecture_id가 실제로 존재하는지 확인)
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='출결 관리 테이블'
    `);
    
    console.log('✅ attendance 테이블 생성 완료!');
    console.log('');
    
    // ========================================
    // 3. 테이블 정보 확인
    // ========================================
    console.log('📊 생성된 테이블 정보:');
    console.log('');
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'lms_system']);
    
    columns.forEach((col, index) => {
      const nullable = col.IS_NULLABLE === 'YES' ? '(NULL 허용)' : '(필수)';
      console.log(`   ${index + 1}. ${col.COLUMN_NAME.padEnd(18)} ${col.COLUMN_TYPE.padEnd(20)} ${nullable}`);
      if (col.COLUMN_COMMENT) {
        console.log(`      💬 ${col.COLUMN_COMMENT}`);
      }
    });
    console.log('');
    
    // ========================================
    // 4. 최종 메시지
    // ========================================
    console.log('🎉 ==========================================');
    console.log('🎉  성공!');
    console.log('🎉 ==========================================');
    console.log('');
    
    console.log('✨ 테이블이 다음 기준으로 생성되었습니다:');
    console.log('   ✅ student_id: INT (학생 ID와 맞음)');
    console.log('   ✅ lecture_id: VARCHAR(50) (강의 ID와 맞음)');
    console.log('   ✅ 모든 필요한 컬럼 포함');
    console.log('   ✅ 외래키 제약 설정 완료');
    console.log('');
    
    console.log('📌 다음 단계:');
    console.log('   1. ✅ 백엔드 서버 재시작: Ctrl+C → npm start');
    console.log('   2. ✅ 브라우저 새로고침: Ctrl + Shift + R');
    console.log('   3. ✅ 대시보드에서 출결 기능 테스트!');
    console.log('');
    
    console.log('💡 이제 출결 기능이 완벽하게 작동할 거예요!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error.message);
    console.error('');
    console.error('📝 오류 상세:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL 연결 종료');
      console.log('');
    }
  }
}

createAttendanceTable();
