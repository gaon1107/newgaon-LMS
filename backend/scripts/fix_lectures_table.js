const { query } = require('../config/database');

async function fixLecturesTable() {
  try {
    console.log('📋 lectures 테이블 확인 중...\n');

    // 현재 테이블 구조 확인
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lms_system' 
      AND TABLE_NAME = 'lectures'
    `);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('현재 컬럼:', columnNames.join(', '));

    // instructor_id 컬럼이 없으면 추가
    if (!columnNames.includes('instructor_id')) {
      console.log('\n❌ instructor_id 컬럼이 없습니다. 추가합니다...');
      
      await query(`
        ALTER TABLE lectures 
        ADD COLUMN instructor_id INT NULL AFTER name,
        ADD INDEX idx_instructor_id (instructor_id)
      `);
      
      console.log('✅ instructor_id 컬럼 추가 완료!');
    } else {
      console.log('\n✅ instructor_id 컬럼이 이미 존재합니다.');
    }

    // 업데이트된 구조 확인
    const updatedColumns = await query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lms_system' 
      AND TABLE_NAME = 'lectures'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 최종 테이블 구조:');
    console.log('┌────────────────────┬──────────────────┬──────────┬─────────┐');
    console.log('│ Column             │ Type             │ Nullable │ Default │');
    console.log('├────────────────────┼──────────────────┼──────────┼─────────┤');
    
    updatedColumns.forEach(col => {
      const name = col.COLUMN_NAME.padEnd(18);
      const type = col.COLUMN_TYPE.padEnd(16);
      const nullable = col.IS_NULLABLE.padEnd(8);
      const def = (col.COLUMN_DEFAULT || 'NULL').padEnd(7);
      console.log(`│ ${name} │ ${type} │ ${nullable} │ ${def} │`);
    });
    
    console.log('└────────────────────┴──────────────────┴──────────┴─────────┘');

    console.log('\n🎉 작업 완료!');
    return true;

  } catch (error) {
    console.error('❌ 테이블 수정 실패:', error.message);
    return false;
  }
}

// 직접 실행
if (require.main === module) {
  fixLecturesTable()
    .then(() => {
      console.log('\n✅ 모든 작업 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { fixLecturesTable };
