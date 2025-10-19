const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Multi-tenant 아키텍처 마이그레이션 스크립트
 *
 * 작업 내용:
 * 1. tenants 마스터 테이블 생성
 * 2. 기존 VARCHAR tenant_id를 INT로 변환
 * 3. 누락된 테이블에 tenant_id 추가
 * 4. 외래키 설정으로 데이터 무결성 보장
 * 5. 인덱스 최적화
 */

async function migrateToMultiTenant() {
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Multi-Tenant 마이그레이션 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // STEP 1: tenants 마스터 테이블 생성
    // ========================================
    console.log('📋 STEP 1: tenants 마스터 테이블 생성\n');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '학원명',
        code VARCHAR(50) UNIQUE NOT NULL COMMENT '학원 코드 (고유)',
        business_number VARCHAR(20) UNIQUE COMMENT '사업자번호',
        owner_name VARCHAR(50) COMMENT '원장 이름',
        phone VARCHAR(20) COMMENT '대표 전화',
        email VARCHAR(100) COMMENT '대표 이메일',
        address TEXT COMMENT '주소',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '상태',
        max_students INT DEFAULT 1000 COMMENT '최대 학생 수',
        max_instructors INT DEFAULT 50 COMMENT '최대 강사 수',
        subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'basic' COMMENT '요금제',
        subscription_start_date DATE COMMENT '구독 시작일',
        subscription_end_date DATE COMMENT '구독 종료일',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_code (code),
        INDEX idx_status (status),
        INDEX idx_subscription (subscription_plan, subscription_end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='학원 마스터 테이블 (Multi-tenant)'
    `);

    console.log('✅ tenants 테이블 생성 완료\n');

    // ========================================
    // STEP 2: 기존 데이터에서 tenant 정보 추출
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 2: 기존 tenant_id(VARCHAR) 데이터 확인\n');

    // users 테이블에서 고유한 tenant_id 추출
    const [existingTenants] = await connection.execute(`
      SELECT DISTINCT tenant_id
      FROM users
      WHERE tenant_id IS NOT NULL AND tenant_id != ''
    `);

    console.log(`발견된 기존 tenant: ${existingTenants.length}개`);

    // tenants 테이블에 기존 학원 등록
    const tenantMapping = new Map(); // VARCHAR -> INT 매핑

    for (const row of existingTenants) {
      const oldTenantId = row.tenant_id;

      // tenant_id에서 학원명 추출 (예: "tenant_newgaon_123" -> "newgaon")
      const tenantName = oldTenantId.split('_')[1] || 'unknown';
      const tenantCode = `academy_${tenantName}`;

      try {
        const [result] = await connection.execute(`
          INSERT INTO tenants (name, code, status, subscription_plan)
          VALUES (?, ?, 'active', 'basic')
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        `, [`${tenantName} 학원`, tenantCode]);

        const newTenantId = result.insertId;
        tenantMapping.set(oldTenantId, newTenantId);

        console.log(`✅ "${oldTenantId}" -> tenant ID: ${newTenantId}`);
      } catch (error) {
        console.error(`❌ tenant 등록 실패: ${oldTenantId}`, error.message);
      }
    }

    // 기존 데이터가 없으면 기본 tenant 생성
    if (existingTenants.length === 0) {
      console.log('\n⚠️  기존 tenant 데이터 없음. 기본 tenant 생성...');

      const [result] = await connection.execute(`
        INSERT INTO tenants (name, code, status, subscription_plan)
        VALUES ('새가온 학원', 'academy_newgaon', 'active', 'premium')
      `);

      const defaultTenantId = result.insertId;
      console.log(`✅ 기본 tenant 생성 완료 (ID: ${defaultTenantId})\n`);
    }

    // ========================================
    // STEP 3: 임시 컬럼 추가 (tenant_id_new INT)
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 3: 기존 테이블에 tenant_id_new (INT) 컬럼 추가\n');

    const tablesWithTenant = ['users', 'students', 'instructors', 'lectures', 'attendance', 'payments'];

    for (const table of tablesWithTenant) {
      try {
        // 임시 컬럼 추가
        await connection.execute(`
          ALTER TABLE ${table}
          ADD COLUMN tenant_id_new INT NULL COMMENT '학원 ID (새 버전)'
        `);
        console.log(`✅ ${table}.tenant_id_new 추가 완료`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  ${table}.tenant_id_new 이미 존재 (건너뜀)`);
        } else {
          throw error;
        }
      }
    }

    // ========================================
    // STEP 4: VARCHAR -> INT 데이터 변환
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 4: tenant_id VARCHAR -> INT 데이터 변환\n');

    // tenants 테이블에서 모든 매핑 정보 가져오기
    const [allTenants] = await connection.execute('SELECT id, code FROM tenants');

    for (const table of tablesWithTenant) {
      console.log(`\n🔄 ${table} 테이블 변환 중...`);

      // 기존 VARCHAR tenant_id가 있는 경우 변환
      for (const tenant of allTenants) {
        const [oldTenantRows] = await connection.execute(
          `SELECT tenant_id FROM ${table} WHERE tenant_id LIKE ? LIMIT 1`,
          [`%${tenant.code.replace('academy_', '')}%`]
        );

        if (oldTenantRows.length > 0) {
          const oldTenantId = oldTenantRows[0].tenant_id;

          await connection.execute(`
            UPDATE ${table}
            SET tenant_id_new = ?
            WHERE tenant_id = ?
          `, [tenant.id, oldTenantId]);

          const [countResult] = await connection.execute(
            `SELECT COUNT(*) as cnt FROM ${table} WHERE tenant_id = ?`,
            [oldTenantId]
          );

          console.log(`   ✅ "${oldTenantId}" -> ${tenant.id} (${countResult[0].cnt}건)`);
        }
      }

      // tenant_id가 NULL인 데이터는 첫 번째 tenant로 할당
      if (allTenants.length > 0) {
        const defaultTenantId = allTenants[0].id;

        const [result] = await connection.execute(`
          UPDATE ${table}
          SET tenant_id_new = ?
          WHERE tenant_id IS NULL OR tenant_id = ''
        `, [defaultTenantId]);

        if (result.affectedRows > 0) {
          console.log(`   ⚠️  NULL 데이터 ${result.affectedRows}건 -> tenant ${defaultTenantId}로 할당`);
        }
      }
    }

    // ========================================
    // STEP 5: 기존 컬럼 삭제 및 이름 변경
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 5: 기존 VARCHAR tenant_id 삭제 및 컬럼 이름 변경\n');

    for (const table of tablesWithTenant) {
      try {
        // 기존 VARCHAR tenant_id 삭제
        await connection.execute(`ALTER TABLE ${table} DROP COLUMN tenant_id`);
        console.log(`✅ ${table}.tenant_id (VARCHAR) 삭제`);

        // tenant_id_new -> tenant_id로 이름 변경
        await connection.execute(`
          ALTER TABLE ${table}
          CHANGE COLUMN tenant_id_new tenant_id INT NOT NULL COMMENT '학원 ID'
        `);
        console.log(`✅ ${table}.tenant_id_new -> tenant_id (INT) 변경`);

        // 인덱스 추가
        await connection.execute(`
          ALTER TABLE ${table}
          ADD INDEX idx_tenant_id (tenant_id)
        `);
        console.log(`✅ ${table}.tenant_id 인덱스 추가\n`);

      } catch (error) {
        console.error(`❌ ${table} 처리 실패:`, error.message);
      }
    }

    // ========================================
    // STEP 6: 누락된 테이블에 tenant_id 추가
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 6: 누락된 테이블에 tenant_id INT 추가\n');

    const missingTables = [
      'attendance_logs',
      'attendance_records',
      'instructor_lectures',
      'licenses',
      'student_lectures',
      'teachers'
    ];

    for (const table of missingTables) {
      try {
        // 테이블 존재 여부 확인
        const [tables] = await connection.execute(`SHOW TABLES LIKE '${table}'`);

        if (tables.length === 0) {
          console.log(`⚠️  ${table} 테이블 없음 (건너뜀)`);
          continue;
        }

        // tenant_id INT 추가
        await connection.execute(`
          ALTER TABLE ${table}
          ADD COLUMN tenant_id INT NOT NULL COMMENT '학원 ID',
          ADD INDEX idx_tenant_id (tenant_id)
        `);

        console.log(`✅ ${table}.tenant_id 추가 완료`);

        // 기본값 할당 (첫 번째 tenant)
        if (allTenants.length > 0) {
          const defaultTenantId = allTenants[0].id;

          await connection.execute(`
            UPDATE ${table} SET tenant_id = ? WHERE tenant_id = 0
          `, [defaultTenantId]);

          console.log(`   ✅ 기본 tenant_id(${defaultTenantId}) 할당\n`);
        }

      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  ${table}.tenant_id 이미 존재 (건너뜀)\n`);
        } else {
          console.error(`❌ ${table} 처리 실패:`, error.message, '\n');
        }
      }
    }

    // ========================================
    // STEP 7: 외래키 설정
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 STEP 7: tenant_id 외래키 설정 (데이터 무결성 보장)\n');

    const allTablesToAddFk = [
      ...tablesWithTenant,
      ...missingTables.filter(t => !['teachers'].includes(t)) // teachers는 나중에 처리
    ];

    for (const table of allTablesToAddFk) {
      try {
        // 테이블 존재 여부 확인
        const [tables] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (tables.length === 0) continue;

        // 외래키 이름
        const fkName = `fk_${table}_tenant`;

        // 기존 외래키 삭제 (있을 경우)
        try {
          await connection.execute(`ALTER TABLE ${table} DROP FOREIGN KEY ${fkName}`);
        } catch (e) {
          // 외래키 없으면 무시
        }

        // 외래키 추가
        await connection.execute(`
          ALTER TABLE ${table}
          ADD CONSTRAINT ${fkName}
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
        `);

        console.log(`✅ ${table} -> tenants 외래키 설정 완료`);

      } catch (error) {
        console.error(`⚠️  ${table} 외래키 설정 실패:`, error.message);
      }
    }

    // ========================================
    // 최종 검증
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 최종 검증\n');

    // 모든 테이블의 tenant_id 상태 확인
    const [finalTables] = await connection.execute('SHOW TABLES');
    const finalTableNames = finalTables.map(t => Object.values(t)[0]);

    const verification = [];

    for (const tableName of finalTableNames) {
      if (tableName === 'tenants') continue;

      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      const tenantCol = columns.find(col => col.Field === 'tenant_id');

      if (tenantCol) {
        verification.push({
          테이블: tableName,
          'tenant_id 타입': tenantCol.Type,
          'Null 허용': tenantCol.Null,
          '인덱스': tenantCol.Key
        });
      }
    }

    console.table(verification);

    // tenants 테이블 데이터 확인
    const [tenantsData] = await connection.execute('SELECT id, name, code, status FROM tenants');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 등록된 학원 목록:\n');
    console.table(tenantsData);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Multi-Tenant 마이그레이션 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 다음 단계:');
    console.log('   1. 모든 API에 tenant_id 필터링 확인');
    console.log('   2. 회원가입 API 구현 (새 학원 등록)');
    console.log('   3. 로그인 시 tenant_id 자동 할당 확인\n');

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ DB 연결 종료\n');
    }
  }
}

// 실행
migrateToMultiTenant();
