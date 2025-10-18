/**
 * attendance 테이블의 lecture_id를 NULL 허용으로 변경하는 마이그레이션 스크립트
 *
 * 이유: 학원 출석(등원/하원)은 특정 강의가 아닌 학원 전체에 대한 기록이므로
 *       lecture_id를 NULL로 저장할 수 있어야 함
 */

const { db } = require('../config/database');

async function updateAttendanceSchema() {
  try {
    console.log('🔧 attendance 테이블 스키마 변경 시작...');

    // 1. lecture_id를 NULL 허용으로 변경
    await db.execute(`
      ALTER TABLE attendance
      MODIFY COLUMN lecture_id INT NULL
    `);
    console.log('✅ lecture_id 컬럼을 NULL 허용으로 변경 완료');

    // 2. 외래키 제약조건 확인 및 재생성 (필요시)
    const [constraints] = await db.execute(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attendance'
        AND COLUMN_NAME = 'lecture_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    if (constraints.length > 0) {
      const constraintName = constraints[0].CONSTRAINT_NAME;
      console.log(`⚠️  기존 외래키 제약조건 발견: ${constraintName}`);

      // 외래키 삭제
      await db.execute(`ALTER TABLE attendance DROP FOREIGN KEY ${constraintName}`);
      console.log(`✅ 외래키 제약조건 삭제 완료: ${constraintName}`);

      // NULL 허용하는 외래키 재생성
      await db.execute(`
        ALTER TABLE attendance
        ADD CONSTRAINT fk_attendance_lecture
        FOREIGN KEY (lecture_id)
        REFERENCES lectures(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
      console.log('✅ NULL 허용하는 외래키 제약조건 재생성 완료');
    }

    // 3. 변경 결과 확인
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attendance'
        AND COLUMN_NAME = 'lecture_id'
    `);

    console.log('\n📊 변경 결과:');
    console.table(columns);

    console.log('\n✅ 스키마 변경 완료!');
    console.log('이제 학원 출석(등원/하원)은 lecture_id 없이 기록할 수 있습니다.');

  } catch (error) {
    console.error('❌ 스키마 변경 실패:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
updateAttendanceSchema();
