const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTenantIdColumns() {
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

    // 1. users 테이블에 tenant_id 추가
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ users 테이블에 tenant_id 추가...\n');
    
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN tenant_id VARCHAR(50) NULL COMMENT '학원 식별자',
        ADD INDEX idx_tenant_id (tenant_id)
      `);
      console.log('✅ users 테이블에 tenant_id 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  tenant_id 컬럼이 이미 존재합니다 (건너뜀)');
      } else {
        throw error;
      }
    }

    // 2. students 테이블에 tenant_id 추가
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ students 테이블에 tenant_id 추가...\n');
    
    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN tenant_id VARCHAR(50) NULL COMMENT '학원 식별자',
        ADD INDEX idx_tenant_id (tenant_id)
      `);
      console.log('✅ students 테이블에 tenant_id 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  tenant_id 컬럼이 이미 존재합니다 (건너뜀)');
      } else {
        throw error;
      }
    }

    // 3. instructors 테이블에 tenant_id 추가
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣ instructors 테이블에 tenant_id 추가...\n');
    
    try {
      await connection.execute(`
        ALTER TABLE instructors 
        ADD COLUMN tenant_id VARCHAR(50) NULL COMMENT '학원 식별자',
        ADD INDEX idx_tenant_id (tenant_id)
      `);
      console.log('✅ instructors 테이블에 tenant_id 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  tenant_id 컬럼이 이미 존재합니다 (건너뜀)');
      } else {
        throw error;
      }
    }

    // 4. lectures 테이블에 tenant_id 추가
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣ lectures 테이블에 tenant_id 추가...\n');
    
    try {
      await connection.execute(`
        ALTER TABLE lectures 
        ADD COLUMN tenant_id VARCHAR(50) NULL COMMENT '학원 식별자',
        ADD INDEX idx_tenant_id (tenant_id)
      `);
      console.log('✅ lectures 테이블에 tenant_id 추가 완료');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  tenant_id 컬럼이 이미 존재합니다 (건너뜀)');
      } else {
        throw error;
      }
    }

    // 5. attendance 테이블에 tenant_id 추가 (테이블이 있을 경우만)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣ attendance 테이블에 tenant_id 추가...\n');
    
    try {
      // 테이블 존재 여부 확인
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE 'attendance'
      `);
      
      if (tables.length > 0) {
        await connection.execute(`
          ALTER TABLE attendance 
          ADD COLUMN tenant_id VARCHAR(50) NULL COMMENT '학원 식별자',
          ADD INDEX idx_tenant_id (tenant_id)
        `);
        console.log('✅ attendance 테이블에 tenant_id 추가 완료');
      } else {
        console.log('⚠️  attendance 테이블이 아직 생성되지 않았습니다 (건너뜀)');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  tenant_id 컬럼이 이미 존재합니다 (건너뜀)');
      } else {
        console.log('⚠️  attendance 테이블 처리 실패 (건너뜀):', error.message);
      }
    }

    // 6. newgaon 계정에 tenant_id 생성 및 할당
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6️⃣ newgaon 계정에 tenant_id 할당...\n');
    
    const newgaonTenantId = 'tenant_newgaon_' + Date.now();
    
    await connection.execute(`
      UPDATE users 
      SET tenant_id = ? 
      WHERE username = 'newgaon' AND tenant_id IS NULL
    `, [newgaonTenantId]);
    
    console.log(`✅ newgaon 계정에 tenant_id 할당: ${newgaonTenantId}`);

    // 7. 기존 데이터에 newgaon의 tenant_id 할당
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('7️⃣ 기존 데이터에 tenant_id 할당...\n');

    // students
    const [studentsResult] = await connection.execute(`
      UPDATE students 
      SET tenant_id = ? 
      WHERE tenant_id IS NULL
    `, [newgaonTenantId]);
    console.log(`✅ 학생 ${studentsResult.affectedRows}명에 tenant_id 할당`);

    // instructors
    const [instructorsResult] = await connection.execute(`
      UPDATE instructors 
      SET tenant_id = ? 
      WHERE tenant_id IS NULL
    `, [newgaonTenantId]);
    console.log(`✅ 강사 ${instructorsResult.affectedRows}명에 tenant_id 할당`);

    // lectures
    const [lecturesResult] = await connection.execute(`
      UPDATE lectures 
      SET tenant_id = ? 
      WHERE tenant_id IS NULL
    `, [newgaonTenantId]);
    console.log(`✅ 강의 ${lecturesResult.affectedRows}개에 tenant_id 할당`);

    // attendance (테이블이 있을 경우만)
    try {
      const [tables] = await connection.execute(`SHOW TABLES LIKE 'attendance'`);
      if (tables.length > 0) {
        const [attendanceResult] = await connection.execute(`
          UPDATE attendance 
          SET tenant_id = ? 
          WHERE tenant_id IS NULL
        `, [newgaonTenantId]);
        console.log(`✅ 출석 ${attendanceResult.affectedRows}건에 tenant_id 할당`);
      }
    } catch (error) {
      console.log('⚠️  attendance 테이블 처리 실패 (건너뜀)');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 모든 작업 완료!\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addTenantIdColumns();
