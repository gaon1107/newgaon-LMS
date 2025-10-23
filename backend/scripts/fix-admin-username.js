const { query } = require('../config/database');

async function fixAdminUsername() {
  try {
    console.log('🔍 현재 ID=1 사용자 정보 조회 중...\n');

    // 현재 정보 조회
    const currentUser = await query(
      'SELECT id, username, name, email, tenant_id FROM users WHERE id = 1'
    );

    if (currentUser.length === 0) {
      console.log('❌ ID가 1인 사용자를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('현재 정보:');
    console.log(`  ID: ${currentUser[0].id}`);
    console.log(`  Username: ${currentUser[0].username}`);
    console.log(`  Name: ${currentUser[0].name}`);
    console.log(`  Email: ${currentUser[0].email}`);
    console.log(`  Tenant ID: ${currentUser[0].tenant_id}\n`);

    if (currentUser[0].username === 'newgaon') {
      console.log('✅ 이미 username이 "newgaon"입니다. 변경 불필요');
      process.exit(0);
    }

    // 아이디 변경
    console.log('✏️ username을 "' + currentUser[0].username + '"에서 "newgaon"으로 변경 중...\n');
    
    await query(
      'UPDATE users SET username = ? WHERE id = 1',
      ['newgaon']
    );

    console.log('✅ 수정 완료!\n');

    // 수정 후 확인
    const updatedUser = await query(
      'SELECT id, username, name, email, tenant_id FROM users WHERE id = 1'
    );

    console.log('변경된 정보:');
    console.log(`  ID: ${updatedUser[0].id}`);
    console.log(`  Username: ${updatedUser[0].username}`);
    console.log(`  Name: ${updatedUser[0].name}`);
    console.log(`  Email: ${updatedUser[0].email}`);
    console.log(`  Tenant ID: ${updatedUser[0].tenant_id}\n`);

    console.log('🎉 완료! 가입현황 관리 페이지를 새로고침하면 반영됩니다.');

    process.exit(0);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 직접 실행
if (require.main === module) {
  fixAdminUsername();
}

module.exports = { fixAdminUsername };
