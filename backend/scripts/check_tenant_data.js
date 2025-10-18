const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTenantData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('✅ MySQL 연결 성공!\n');

    // newgaon 사용자 정보 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 newgaon 사용자 정보\n');
    const [users] = await connection.execute(
      'SELECT id, username, name, tenant_id FROM users WHERE username = ?',
      ['newgaon']
    );
    
    if (users.length === 0) {
      console.log('❌ newgaon 사용자를 찾을 수 없습니다!');
      return;
    }

    const newgaonUser = users[0];
    console.log(`사용자 ID: ${newgaonUser.id}`);
    console.log(`사용자명: ${newgaonUser.username}`);
    console.log(`이름: ${newgaonUser.name}`);
    console.log(`Tenant ID: ${newgaonUser.tenant_id || '(없음)'}`);

    // 모든 학생의 tenant_id 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 전체 학생 목록 (tenant_id 포함)\n');
    const [allStudents] = await connection.execute(
      'SELECT id, name, school, grade, tenant_id FROM students WHERE is_active = true'
    );
    
    console.log(`총 ${allStudents.length}명의 학생이 등록되어 있습니다.\n`);
    allStudents.forEach(s => {
      console.log(`  ${s.id}. ${s.name} (${s.school} ${s.grade}학년) - Tenant ID: ${s.tenant_id || '(없음)'}`);
    });

    // newgaon tenant_id에 해당하는 학생만 필터링
    if (newgaonUser.tenant_id) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎯 newgaon (tenant_id: ${newgaonUser.tenant_id})의 학생들\n`);
      
      const [tenantStudents] = await connection.execute(
        'SELECT id, name, school, grade FROM students WHERE tenant_id = ? AND is_active = true',
        [newgaonUser.tenant_id]
      );
      
      console.log(`${tenantStudents.length}명의 학생이 해당됩니다.\n`);
      
      if (tenantStudents.length > 0) {
        tenantStudents.forEach(s => {
          console.log(`  ${s.id}. ${s.name} (${s.school} ${s.grade}학년)`);
        });
      } else {
        console.log('⚠️ newgaon 계정에 연결된 학생이 없습니다!');
        console.log('\n💡 해결 방법: 학생들의 tenant_id를 newgaon의 tenant_id로 업데이트해야 합니다.');
      }
    } else {
      console.log('\n⚠️ newgaon 사용자에게 tenant_id가 설정되어 있지 않습니다!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTenantData();
