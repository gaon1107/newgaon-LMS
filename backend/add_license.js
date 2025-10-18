const mysql = require('mysql2/promise');
require('dotenv').config();

async function addLicense() {
  console.log('🔧 라이선스 추가 시작...\n');

  // 데이터베이스 연결
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'lms_db'
  });

  try {
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 1. newgaon 사용자 확인
    const [users] = await connection.execute(
      'SELECT id, username, name FROM users WHERE username = ?',
      ['newgaon']
    );

    if (users.length === 0) {
      console.error('❌ newgaon 사용자를 찾을 수 없습니다!');
      return;
    }

    const user = users[0];
    console.log('✅ 사용자 정보:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - 사용자명: ${user.username}`);
    console.log(`   - 이름: ${user.name}\n`);

    // 2. 기존 라이선스 확인
    const [existingLicenses] = await connection.execute(
      'SELECT * FROM licenses WHERE user_id = ? AND license_type = ?',
      [user.id, 'attend']
    );

    if (existingLicenses.length > 0) {
      console.log('⚠️  기존 라이선스가 이미 존재합니다:');
      console.log(`   - 라이선스 키: ${existingLicenses[0].license_key}`);
      console.log(`   - 종료일: ${existingLicenses[0].end_date}`);
      console.log(`   - 활성: ${existingLicenses[0].is_active}\n`);
      
      console.log('🔄 기존 라이선스를 업데이트합니다...\n');
      
      // 기존 라이선스 업데이트
      await connection.execute(
        `UPDATE licenses 
         SET license_key = ?, 
             start_date = NOW(), 
             end_date = DATE_ADD(NOW(), INTERVAL 365 DAY),
             is_active = TRUE,
             updated_at = NOW()
         WHERE user_id = ? AND license_type = ?`,
        ['NEWGAON_ATTEND_2025', user.id, 'attend']
      );
    } else {
      console.log('➕ 새 라이선스를 추가합니다...\n');
      
      // 새 라이선스 추가
      await connection.execute(
        `INSERT INTO licenses (user_id, license_type, license_key, start_date, end_date, is_active, created_at)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), TRUE, NOW())`,
        [user.id, 'attend', 'NEWGAON_ATTEND_2025']
      );
    }

    // 3. 결과 확인
    const [finalLicenses] = await connection.execute(
      `SELECT 
        license_type,
        license_key,
        start_date,
        end_date,
        DATEDIFF(end_date, CURDATE()) as remaining_days,
        is_active
       FROM licenses 
       WHERE user_id = ? AND license_type = ?`,
      [user.id, 'attend']
    );

    if (finalLicenses.length > 0) {
      const license = finalLicenses[0];
      console.log('✅ 라이선스 추가/업데이트 완료!\n');
      console.log('📋 현재 라이선스 정보:');
      console.log(`   - 타입: ${license.license_type}`);
      console.log(`   - 키: ${license.license_key}`);
      console.log(`   - 시작일: ${license.start_date}`);
      console.log(`   - 종료일: ${license.end_date}`);
      console.log(`   - 남은 일수: ${license.remaining_days}일`);
      console.log(`   - 활성: ${license.is_active ? '예' : '아니오'}\n`);
      
      console.log('🎉 완료! 이제 앱에서 로그인하면 사용만료 메시지가 사라집니다!');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
addLicense()
  .then(() => {
    console.log('\n✅ 스크립트 실행 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
