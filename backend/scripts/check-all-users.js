const { query } = require('../config/database');

async function checkUsername() {
  try {
    console.log('모든 사용자 조회 중...\n');

    const users = await query(
      'SELECT id, username, name, email, tenant_id FROM users ORDER BY id'
    );

    console.log('┌────┬────────────┬──────────┬─────────────────────────┬──────────┐');
    console.log('│ ID │ Username   │ Name     │ Email                   │ Tenant   │');
    console.log('├────┼────────────┼──────────┼─────────────────────────┼──────────┤');
    
    users.forEach(user => {
      const id = String(user.id).padEnd(4);
      const username = (user.username || '-').padEnd(10);
      const name = (user.name || '-').padEnd(8);
      const email = (user.email || '-').padEnd(23);
      const tenant = String(user.tenant_id).padEnd(8);
      console.log(`│ ${id}│ ${username}│ ${name}│ ${email}│ ${tenant}│`);
    });
    
    console.log('└────┴────────────┴──────────┴─────────────────────────┴──────────┘\n');

    process.exit(0);

  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkUsername();
}

module.exports = { checkUsername };
