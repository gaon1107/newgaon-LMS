const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkTenantColumns() {
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 모든 테이블 목록 가져오기
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    console.log(`📊 총 ${tableNames.length}개의 테이블 발견:\n`);

    const results = [];

    for (const tableName of tableNames) {
      // 각 테이블의 컬럼 정보 확인
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      const hasTenantId = columns.some(col => col.Field === 'tenant_id');

      results.push({
        테이블: tableName,
        'tenant_id 존재': hasTenantId ? '✅ 있음' : '❌ 없음',
        '총 컬럼 수': columns.length
      });
    }

    console.table(results);

    // tenant_id가 없는 테이블 목록
    const tablesWithoutTenant = results
      .filter(r => r['tenant_id 존재'] === '❌ 없음')
      .map(r => r['테이블']);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (tablesWithoutTenant.length > 0) {
      console.log(`\n⚠️  tenant_id가 없는 테이블 (${tablesWithoutTenant.length}개):\n`);
      tablesWithoutTenant.forEach(name => console.log(`   - ${name}`));
    } else {
      console.log('\n✅ 모든 테이블에 tenant_id가 있습니다!');
    }

    // users 테이블 상세 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 users 테이블 구조:\n');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.table(userColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // payments 테이블 존재 여부 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (tableNames.includes('payments')) {
      console.log('\n💳 payments 테이블 구조:\n');
      const [paymentColumns] = await connection.execute('DESCRIBE payments');
      console.table(paymentColumns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key,
        Default: col.Default
      })));
    } else {
      console.log('\n⚠️  payments 테이블이 존재하지 않습니다.');
    }

    console.log('\n✅ 검사 완료!\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTenantColumns();
