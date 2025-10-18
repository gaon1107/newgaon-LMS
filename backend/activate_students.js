const { pool } = require('./config/database');

async function activateAllStudents() {
  try {
    console.log('=================================');
    console.log('학생 활성화 스크립트 시작');
    console.log('=================================\n');

    // 1. 현재 상태 확인
    console.log('📊 1단계: 현재 상태 확인\n');
    const [currentStatus] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 OR is_active IS NULL THEN 1 ELSE 0 END) as inactive
      FROM students
    `);
    
    console.log('현재 학생 통계:');
    console.log(`  전체: ${currentStatus[0].total}명`);
    console.log(`  활성: ${currentStatus[0].active}명`);
    console.log(`  비활성: ${currentStatus[0].inactive}명\n`);

    // 2. 비활성 학생 목록 확인
    console.log('📋 비활성 학생 목록:\n');
    const [inactiveStudents] = await pool.execute(`
      SELECT id, name, attendance_number, is_active
      FROM students
      WHERE is_active = 0 OR is_active IS NULL
      ORDER BY id
    `);

    if (inactiveStudents.length > 0) {
      inactiveStudents.forEach(student => {
        console.log(`  [${student.id}] ${student.name} (출결번호: ${student.attendance_number || '없음'}) - is_active: ${student.is_active}`);
      });
      console.log('');
    } else {
      console.log('  비활성 학생이 없습니다!\n');
    }

    // 3. 모든 학생 활성화
    console.log('🔧 2단계: 모든 학생 활성화 실행\n');
    const [updateResult] = await pool.execute(`
      UPDATE students 
      SET is_active = 1 
      WHERE is_active IS NULL OR is_active = 0
    `);

    console.log(`✅ ${updateResult.affectedRows}명의 학생이 활성화되었습니다!\n`);

    // 4. 최종 결과 확인
    console.log('📊 3단계: 최종 결과 확인\n');
    const [finalStatus] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 OR is_active IS NULL THEN 1 ELSE 0 END) as inactive
      FROM students
    `);

    console.log('최종 학생 통계:');
    console.log(`  전체: ${finalStatus[0].total}명`);
    console.log(`  활성: ${finalStatus[0].active}명`);
    console.log(`  비활성: ${finalStatus[0].inactive}명\n`);

    // 5. 활성화된 학생 목록
    console.log('📋 활성화된 전체 학생 목록:\n');
    const [activeStudents] = await pool.execute(`
      SELECT id, name, attendance_number, is_active
      FROM students
      WHERE is_active = 1
      ORDER BY id
    `);

    activeStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. [${student.id}] ${student.name} (출결번호: ${student.attendance_number})`);
    });

    console.log('\n=================================');
    console.log('✅ 모든 작업 완료!');
    console.log('=================================');

    // 연결 종료
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// 스크립트 실행
activateAllStudents();
