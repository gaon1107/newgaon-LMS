const { query } = require('../config/database');

async function checkRoles() {
  try {
    console.log('모든 사용자의 역할 조회 중...\n');

    const users = await query(
      'SELECT id, username, name, email, role, tenant_id FROM users ORDER BY id'
    );

    console.log('┌────┬────────────┬──────────────┬─────────────────────────┬──────────┬──────────┐');
    console.log('│ ID │ Username   │ Name         │ Email                   │ Role     │ Tenant   │');
    console.log('├────┼────────────┼──────────────┼─────────────────────────┼──────────┼──────────┤');
    
    users.forEach(user => {
      const id = String(user.id).padEnd(4);
      const username = (user.username || '-').padEnd(10);
      const name = (user.name || '-').padEnd(12);
      const email = (user.email || '-').padEnd(23);
      const role = (user.role || '-').padEnd(8);
      const tenant = String(user.tenant_id).padEnd(8);
      console.log(`│ ${id}│ ${username}│ ${name}│ ${email}│ ${role}│ ${tenant}│`);
    });
    
    console.log('└────┴────────────┴──────────────┴─────────────────────────┴──────────┴──────────┘\n');

    // superadmin 찾기
    const superadmin = users.find(u => u.role === 'superadmin');
    if (superadmin) {
      console.log('🔑 슈퍼관리자:');
      console.log(`   ID: ${superadmin.id}`);
      console.log(`   Username: ${superadmin.username}`);
      console.log(`   Name: ${superadmin.name}`);
      console.log(`   Tenant ID: ${superadmin.tenant_id}\n`);
    } else {
      console.log('⚠️  슈퍼관리자가 없습니다!\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkRoles();
}

module.exports = { checkRoles };
