const bcrypt = require('bcryptjs');
const { db, query } = require('../config/database');

async function addNewgaonUser() {
  try {
    console.log('🔧 newgaon 사용자 계정 추가 중...');

    // 기존 newgaon 계정 확인
    const existingUser = await query('SELECT id FROM users WHERE username = ?', ['newgaon']);
    
    if (existingUser.length > 0) {
      console.log('✅ newgaon 계정이 이미 존재합니다.');
      return;
    }

    // newgaon 계정 추가
    const newgaonPassword = bcrypt.hashSync('newgaon', 10);
    
    await query(`
      INSERT INTO users (username, password_hash, name, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['newgaon', newgaonPassword, '뉴가온 관리자', 'newgaon@example.com', 'admin', 1]);

    console.log('✅ newgaon/newgaon 계정이 성공적으로 추가되었습니다!');

    // 추가된 사용자 확인
    const users = await query('SELECT username, name, role FROM users');
    console.log('📋 현재 사용자 목록:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ 사용자 추가 실패:', error);
  }
}

// 직접 실행
if (require.main === module) {
  addNewgaonUser()
    .then(() => {
      console.log('🎉 작업 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { addNewgaonUser };
