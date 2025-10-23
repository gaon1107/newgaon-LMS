const { query } = require('../config/database');

async function checkCurrentState() {
  try {
    const users = await query(
      'SELECT id, username, name, role, tenant_id FROM users ORDER BY id'
    );

    console.log('\n현재 users 테이블 상태:\n');
    console.log('┌────┬────────────┬──────────────┬──────────┬──────────┐');
    console.log('│ ID │ Username   │ Name         │ Role     │ Tenant   │');
    console.log('├────┼────────────┼──────────────┼──────────┼──────────┤');
    
    users.forEach(user => {
      const id = String(user.id).padEnd(4);
      const username = (user.username || '-').padEnd(10);
      const name = (user.name || '-').padEnd(12);
      const role = (user.role || '-').padEnd(8);
      const tenant = String(user.tenant_id).padEnd(8);
      console.log(`│ ${id}│ ${username}│ ${name}│ ${role}│ ${tenant}│`);
    });
    
    console.log('└────┴────────────┴──────────────┴──────────┴──────────┘\n');

    process.exit(0);

  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkCurrentState();
}

module.exports = { checkCurrentState };
