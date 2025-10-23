const { query } = require('../config/database');

async function restoreSuperadmin() {
  try {
    console.log('newgaon 계정을 superadmin으로 복구 중...\n');

    // 현재 상태 확인
    const currentUser = await query(
      'SELECT id, username, name, role, tenant_id FROM users WHERE username = "newgaon"'
    );

    if (!currentUser || currentUser.length === 0) {
      console.log('❌ newgaon 사용자를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('현재 사용자 정보:');
    console.log(`  ID: ${currentUser[0].id}`);
    console.log(`  Username: ${currentUser[0].username}`);
    console.log(`  Name: ${currentUser[0].name}`);
    console.log(`  Role: ${currentUser[0].role}`);
    console.log(`  Tenant ID: ${currentUser[0].tenant_id}\n`);

    // role을 superadmin으로 변경
    const result = await query(
      'UPDATE users SET role = "superadmin" WHERE username = "newgaon"'
    );

    console.log('✅ 복구 완료!');
    console.log(`   업데이트된 행: ${result.affectedRows}개\n`);

    // 업데이트 후 확인
    const updatedUser = await query(
      'SELECT id, username, name, role, tenant_id FROM users WHERE username = "newgaon"'
    );

    console.log('복구된 사용자 정보:');
    console.log(`  ID: ${updatedUser[0].id}`);
    console.log(`  Username: ${updatedUser[0].username}`);
    console.log(`  Name: ${updatedUser[0].name}`);
    console.log(`  Role: ${updatedUser[0].role} ✅ (슈퍼관리자)`);
    console.log(`  Tenant ID: ${updatedUser[0].tenant_id}\n`);

    // 모든 사용자 확인
    const allUsers = await query(
      'SELECT id, username, name, role, tenant_id FROM users ORDER BY id'
    );

    console.log('전체 사용자 목록:');
    console.log('┌────┬────────────┬──────────────┬──────────────┬──────────┐');
    console.log('│ ID │ Username   │ Name         │ Role         │ Tenant   │');
    console.log('├────┼────────────┼──────────────┼──────────────┼──────────┤');

    allUsers.forEach(user => {
      const id = String(user.id).padEnd(4);
      const username = (user.username || '-').padEnd(10);
      const name = (user.name || '-').padEnd(12);
      const role = (user.role || '-').padEnd(12);
      const tenant = String(user.tenant_id).padEnd(8);
      console.log(`│ ${id}│ ${username}│ ${name}│ ${role}│ ${tenant}│`);
    });

    console.log('└────┴────────────┴──────────────┴──────────────┴──────────┘\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  restoreSuperadmin();
}

module.exports = { restoreSuperadmin };
