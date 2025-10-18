const mysql = require('mysql2/promise');
require('dotenv').config();

// 라이선스 테이블 생성
const createLicenseTable = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 라이선스 테이블 생성 시작...');

    // 라이선스 테이블 생성 (user_id를 INT로 수정)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '사용자 ID',
        license_type VARCHAR(50) NOT NULL COMMENT '라이선스 타입 (attend, message, etc)',
        license_key VARCHAR(255) NOT NULL COMMENT '라이선스 키',
        start_date DATE NOT NULL COMMENT '시작일',
        end_date DATE NOT NULL COMMENT '종료일',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_license (user_id, license_type),

        INDEX idx_user (user_id),
        INDEX idx_type (license_type),
        INDEX idx_active (is_active),
        INDEX idx_end_date (end_date)
      ) COMMENT = '라이선스 정보 테이블'
    `);
    console.log('✅ licenses 테이블 생성 완료');

    // 기본 라이선스 데이터 삽입 (newgaon 계정용)
    const [users] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['newgaon']
    );

    if (users.length > 0) {
      const userId = users[0].id;
      
      // 기존 라이선스 확인
      const [existingLicense] = await connection.query(
        'SELECT id FROM licenses WHERE user_id = ? AND license_type = ?',
        [userId, 'attend']
      );

      if (existingLicense.length === 0) {
        // 1년짜리 라이선스 생성 (오늘부터 1년)
        await connection.query(`
          INSERT INTO licenses (user_id, license_type, license_key, start_date, end_date, is_active)
          VALUES (?, 'attend', 'NEWGAON_ATTEND_2025', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), TRUE)
        `, [userId]);
        console.log('✅ newgaon 계정에 기본 라이선스 생성 완료 (1년)');
      } else {
        console.log('ℹ️  newgaon 계정에 이미 라이선스가 있습니다');
      }
    } else {
      console.log('⚠️  newgaon 계정을 찾을 수 없습니다');
    }

    // admin 계정도 확인
    const [adminUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (adminUsers.length > 0) {
      const adminUserId = adminUsers[0].id;
      
      const [existingAdminLicense] = await connection.query(
        'SELECT id FROM licenses WHERE user_id = ? AND license_type = ?',
        [adminUserId, 'attend']
      );

      if (existingAdminLicense.length === 0) {
        await connection.query(`
          INSERT INTO licenses (user_id, license_type, license_key, start_date, end_date, is_active)
          VALUES (?, 'attend', 'ADMIN_ATTEND_2025', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), TRUE)
        `, [adminUserId]);
        console.log('✅ admin 계정에 기본 라이선스 생성 완료 (1년)');
      } else {
        console.log('ℹ️  admin 계정에 이미 라이선스가 있습니다');
      }
    }

    console.log('🎉 라이선스 테이블 및 데이터 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 라이선스 테이블 생성 실패:', error.message);
    console.error('상세 오류:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  createLicenseTable()
    .then(success => {
      if (success) {
        console.log('✅ 라이선스 테이블 생성 성공');
        process.exit(0);
      } else {
        console.log('❌ 라이선스 테이블 생성 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  createLicenseTable
};
