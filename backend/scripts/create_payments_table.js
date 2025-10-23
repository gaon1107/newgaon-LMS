const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPaymentsTable() {
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

    // payments 테이블 생성
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL COMMENT '사용자 ID',
        tenant_id VARCHAR(50) NULL COMMENT '학원 ID (멀티테넌트)',
        product_id VARCHAR(50) NULL COMMENT '상품 ID',
        product_name VARCHAR(100) NOT NULL COMMENT '상품명',
        term_months INT NOT NULL COMMENT '사용 기간 (개월)',
        term_name VARCHAR(50) NOT NULL COMMENT '사용 기간명',
        payment_method VARCHAR(50) NOT NULL COMMENT '결제 방법',
        original_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '기본 금액',
        discount_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '할인 금액',
        subtotal_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '소계 금액',
        tax_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '부가세',
        total_amount DECIMAL(10, 2) NOT NULL COMMENT '총 결제 금액',
        payment_date DATE NOT NULL COMMENT '결제 날짜',
        payment_status VARCHAR(20) DEFAULT 'completed' COMMENT '결제 상태 (completed, pending, failed)',
        promotion_code VARCHAR(50) NULL COMMENT '프로모션 코드',
        notes TEXT NULL COMMENT '비고',
        is_active BOOLEAN DEFAULT true COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        INDEX idx_user_id (user_id),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_payment_date (payment_date),
        INDEX idx_payment_status (payment_status),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='결제 내역 테이블';
    `;

    await connection.execute(createTableQuery);
    console.log('✅ payments 테이블 생성 성공\n');

    // 테이블 구조 확인
    console.log('📋 payments 테이블 구조:\n');
    const [columns] = await connection.execute('DESCRIBE payments');
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

createPaymentsTable();
