const { query } = require('../config/database');

async function deleteAdminUser() {
  try {
    console.log('admin 계정 삭제 중...\n');

    // 삭제 전 확인
    const checkUser = await query(
      'SELECT id, username, name FROM users WHERE id = 1 AND username = "admin"'
    );

    if (!checkUser || checkUser.length === 0) {
      console.log('❌ ID=1, Username=admin인 사용자를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('삭제할 사용자:');
    console.log(`  ID: ${checkUser[0].id}`);
    console.log(`  Username: ${checkUser[0].username}`);
    console.log(`  Name: ${checkUser[0].name}\n`);

    // 삭제 실행
    const result = await query(
      'DELETE FROM users WHERE id = 1 AND username = "admin"'
    );

    console.log('✅ 삭제 완료!');
    console.log(`   삭제된 행: ${result.affectedRows}개\n`);

    // 삭제 후 확인
    const remainingUsers = await query(
      'SELECT id, username, name, role FROM users ORDER BY id'
    );

    console.log('남은 사용자:');
    console.log('┌────┬────────────┬──────────────┬──────────┐');
    console.log('│ ID │ Username   │ Name         │ Role     │');
    console.log('├────┼────────────┼──────────────┼──────────┤');
    
    remainingUsers.forEach(user => {
      const id = String(user.id).padEnd(4);
      const username = (user.username || '-').padEnd(10);
      const name = (user.name || '-').padEnd(12);
      const role = (user.role || '-').padEnd(8);
      console.log(`│ ${id}│ ${username}│ ${name}│ ${role}│`);
    });
    
    console.log('└────┴────────────┴──────────────┴──────────┘\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deleteAdminUser();
}

module.exports = { deleteAdminUser };
