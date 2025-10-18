const { query } = require('../config/database');

async function checkUsers() {
  try {
    console.log('🔍 사용자 계정 확인 중...\n');

    // 모든 사용자 조회
    const users = await query('SELECT username, name, role, is_active FROM users');

    if (users.length === 0) {
      console.log('❌ 등록된 사용자가 없습니다!\n');
      console.log('💡 해결 방법:');
      console.log('   node scripts/add_admin_user.js');
      return false;
    }

    console.log('📋 등록된 사용자 목록:\n');
    console.log('┌──────────────┬──────────────────┬──────────┬────────┐');
    console.log('│ Username     │ Name             │ Role     │ Active │');
    console.log('├──────────────┼──────────────────┼──────────┼────────┤');
    
    users.forEach(user => {
      const username = user.username.padEnd(12);
      const name = user.name.padEnd(16);
      const role = user.role.padEnd(8);
      const active = user.is_active ? 'Yes' : 'No';
      console.log(`│ ${username} │ ${name} │ ${role} │ ${active.padEnd(6)} │`);
    });
    
    console.log('└──────────────┴──────────────────┴──────────┴────────┘\n');

    // admin 계정 확인
    const adminUser = users.find(u => u.username === 'admin');
    if (!adminUser) {
      console.log('⚠️  admin 계정이 없습니다!');
      console.log('💡 해결 방법:');
      console.log('   node scripts/add_admin_user.js\n');
      return false;
    }

    console.log('✅ admin 계정이 존재합니다!');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.is_active ? 'Yes' : 'No'}\n`);

    if (!adminUser.is_active) {
      console.log('⚠️  admin 계정이 비활성화되어 있습니다!');
      return false;
    }

    console.log('🎉 로그인 가능합니다!');
    console.log('   ID: admin');
    console.log('   PW: admin123!');

    return true;

  } catch (error) {
    console.error('❌ 오류:', error.message);
    return false;
  }
}

// 직접 실행
if (require.main === module) {
  checkUsers()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { checkUsers };
