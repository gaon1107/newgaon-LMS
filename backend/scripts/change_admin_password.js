const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function changeAdminPassword() {
  try {
    console.log('🔧 admin 계정 비밀번호 변경 중...\n');

    // admin 계정 확인
    const users = await query('SELECT id, username FROM users WHERE username = ?', ['admin']);
    
    if (users.length === 0) {
      console.log('❌ admin 계정을 찾을 수 없습니다!');
      return false;
    }

    const adminUser = users[0];

    // 새 비밀번호: admin (간단하게)
    const newPassword = 'admin';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // 비밀번호 업데이트
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, adminUser.id]
    );

    console.log('✅ admin 계정 비밀번호가 성공적으로 변경되었습니다!\n');
    console.log('📋 로그인 정보:');
    console.log('   ID: admin');
    console.log('   PW: admin');
    console.log('\n⚠️  개발용으로만 사용하세요. 실서비스에서는 강력한 비밀번호를 사용하세요!');

    return true;

  } catch (error) {
    console.error('❌ 비밀번호 변경 실패:', error.message);
    return false;
  }
}

// 직접 실행
if (require.main === module) {
  changeAdminPassword()
    .then(() => {
      console.log('\n🎉 작업 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { changeAdminPassword };
