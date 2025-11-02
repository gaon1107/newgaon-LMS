const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * attendance 테이블 UNIQUE 제약조건 제거
 * 
 * 목적: 한 학생이 하루에 여러 번의 출입 기록을 남길 수 있도록 변경
 *       - 등원 (1번)
 *       - 외출 → 복귀 (여러 번)
 *       - 하원 (1번)
 */
async function removeAttendanceUniqueConstraint() {
  let connection;

  try {
    console.log('\n========================================');
    console.log('🔧 attendance 테이블 UNIQUE 제약조건 제거');
    console.log('========================================\n');

    // MySQL 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. 현재 제약조건 확인
    console.log('📋 Step 1: 현재 UNIQUE 제약조건 확인 중...');
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'lms_system' 
        AND TABLE_NAME = 'attendance'
        AND CONSTRAINT_TYPE = 'UNIQUE'
    `);

    if (constraints.length === 0) {
      console.log('ℹ️ UNIQUE 제약조건이 이미 없습니다. 작업이 필요 없습니다.\n');
      console.log('========================================');
      return true;
    }

    console.log(`📌 발견된 UNIQUE 제약조건: ${constraints.length}개`);
    constraints.forEach(c => {
      console.log(`   - ${c.CONSTRAINT_NAME}`);
    });
    console.log('');

    // 2. UNIQUE 제약조건 제거
    console.log('🔨 Step 2: UNIQUE 제약조건 제거 중...');
    
    for (const constraint of constraints) {
      try {
        await connection.query(`
          ALTER TABLE attendance 
          DROP INDEX ${constraint.CONSTRAINT_NAME}
        `);
        console.log(`   ✅ ${constraint.CONSTRAINT_NAME} 제거 완료`);
      } catch (error) {
        console.error(`   ⚠️ ${constraint.CONSTRAINT_NAME} 제거 실패:`, error.message);
      }
    }
    console.log('');

    // 3. 제거 확인
    console.log('🔍 Step 3: 제거 확인 중...');
    const [afterConstraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'lms_system' 
        AND TABLE_NAME = 'attendance'
        AND CONSTRAINT_TYPE = 'UNIQUE'
    `);

    if (afterConstraints.length === 0) {
      console.log('   ✅ UNIQUE 제약조건이 모두 제거되었습니다!\n');
    } else {
      console.log(`   ⚠️ 아직 ${afterConstraints.length}개의 UNIQUE 제약조건이 남아있습니다.\n`);
    }

    // 4. 현재 인덱스 확인
    console.log('📊 Step 4: 현재 인덱스 확인 (조회 성능용)');
    const [indexes] = await connection.query(`
      SHOW INDEX FROM attendance
      WHERE Key_name != 'PRIMARY'
    `);

    if (indexes.length > 0) {
      const indexNames = [...new Set(indexes.map(i => i.Key_name))];
      console.log(`   📌 유지되는 인덱스: ${indexNames.length}개`);
      indexNames.forEach(name => {
        console.log(`      - ${name}`);
      });
    }
    console.log('');

    console.log('========================================');
    console.log('✅ 작업 완료!');
    console.log('');
    console.log('📝 이제 다음 작업이 가능합니다:');
    console.log('   - 한 학생이 하루에 여러 번의 출입 기록 생성');
    console.log('   - 등원 → 외출 → 복귀 → 외출 → 복귀 → 하원');
    console.log('');
    console.log('🔄 다음 단계:');
    console.log('   1. 백엔드 서버 재시작');
    console.log('   2. 출입 기록 테스트');
    console.log('========================================\n');

    return true;

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세:', error);
    console.log('\n========================================\n');
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 직접 실행 시
if (require.main === module) {
  removeAttendanceUniqueConstraint()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('실행 오류:', error);
      process.exit(1);
    });
}

module.exports = {
  removeAttendanceUniqueConstraint
};
