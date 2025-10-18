const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function addAdminUser() {
  try {
    console.log('🔧 admin 사용자 계정 추가 중...');

    // 기존 admin 계정 확인
    const existingUser = await query('SELECT id, username FROM users WHERE username = ?', ['admin']);
    
    if (existingUser.length > 0) {
      console.log('✅ admin 계정이 이미 존재합니다.');
      console.log('   ID:', existingUser[0].id);
      console.log('   Username:', existingUser[0].username);
      return;
    }

    // admin 계정 추가
    // 비밀번호: admin123! (보안을 위해 변경 권장)
    const adminPassword = bcrypt.hashSync('admin123!', 10);
    
    await query(`
      INSERT INTO users (username, password_hash, name, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin', adminPassword, '관리자', 'admin@example.com', 'admin', 1]);

    console.log('✅ admin/admin123! 계정이 성공적으로 추가되었습니다!');
    console.log('⚠️  보안을 위해 비밀번호를 변경하는 것을 권장합니다.');

    // 추가된 사용자 확인
    const users = await query('SELECT username, name, role FROM users');
    console.log('\n📋 현재 사용자 목록:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ 사용자 추가 실패:', error);
  }
}

// 직접 실행
if (require.main === module) {
  addAdminUser()
    .then(() => {
      console.log('\n🎉 작업 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { addAdminUser };
