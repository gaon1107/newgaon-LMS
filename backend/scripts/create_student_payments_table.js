const mysql = require('mysql2/promise');
require('dotenv').config();

async function createStudentPaymentsTable() {
  let connection;

  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_system'
    });

    console.log('✅ 데이터베이스 연결 성공\n');

    // student_payments 테이블 생성
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS student_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL COMMENT '학원 ID (멀티테넌트)',
        student_id INT NOT NULL COMMENT '학생 ID',
        lecture_id VARCHAR(50) NULL COMMENT '강의 ID (NULL이면 일반 납부)',
        amount DECIMAL(10, 2) NOT NULL COMMENT '납부 금액',
        payment_date DATE NOT NULL COMMENT '납부일',
        payment_month VARCHAR(7) NOT NULL COMMENT '납부 대상 월 (YYYY-MM)',
        payment_method VARCHAR(50) NOT NULL COMMENT '납부 방식 (현금/카드/계좌이체)',
        payment_status VARCHAR(20) DEFAULT 'completed' COMMENT '납부 상태 (completed, pending, cancelled)',
        notes TEXT NULL COMMENT '비고',
        is_active BOOLEAN DEFAULT true COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_tenant_student (tenant_id, student_id),
        INDEX idx_tenant_date (tenant_id, payment_date),
        INDEX idx_tenant_month (tenant_id, payment_month),
        INDEX idx_student_id (student_id),
        INDEX idx_lecture_id (lecture_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_is_active (is_active),

        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 수강료 납부 내역';
    `;

    await connection.execute(createTableQuery);
    console.log('✅ student_payments 테이블 생성 성공\n');

    // 테이블 구조 확인
    console.log('📋 student_payments 테이블 구조:\n');
    const [columns] = await connection.execute('DESCRIBE student_payments');
    console.table(columns);

    console.log('\n✅ 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ 데이터베이스 연결 종료');
    }
  }
}

createStudentPaymentsTable();
