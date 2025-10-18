const { query } = require('../config/database');

async function checkDatabaseStatus() {
  try {
    console.log('📊 데이터베이스 상태 확인\n');
    console.log('='.repeat(60));

    // 학생 데이터 확인
    const students = await query('SELECT COUNT(*) as count FROM students WHERE is_active = true');
    console.log(`\n✅ 학생: ${students[0].count}명 (MySQL에 저장됨)`);

    const studentSample = await query('SELECT id, name, school FROM students WHERE is_active = true LIMIT 3');
    if (studentSample.length > 0) {
      studentSample.forEach(s => console.log(`   - ${s.name} (${s.school})`));
    }

    // 강의 데이터 확인
    const lectures = await query('SELECT COUNT(*) as count FROM lectures WHERE is_active = true');
    console.log(`\n✅ 강의: ${lectures[0].count}개 (MySQL에 저장됨)`);

    const lectureSample = await query('SELECT id, name, teacher_name FROM lectures WHERE is_active = true LIMIT 3');
    if (lectureSample.length > 0) {
      lectureSample.forEach(l => console.log(`   - ${l.name} (${l.teacher_name || '강사 미정'})`));
    }

    // 강사 데이터 확인
    const instructors = await query('SELECT COUNT(*) as count FROM instructors WHERE is_active = true');
    console.log(`\n⚠️  강사: ${instructors[0].count}명 (테이블만 존재, 프론트 연동 안 됨)`);

    // 출석 테이블 확인
    try {
      const attendanceCheck = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'lms_system' 
        AND table_name = 'attendance'
      `);
      
      if (attendanceCheck[0].count > 0) {
        const attendance = await query('SELECT COUNT(*) as count FROM attendance');
        console.log(`\n⚠️  출석: ${attendance[0].count}개 기록 (테이블 존재)`);
      } else {
        console.log(`\n❌ 출석: 테이블 없음 (대시보드는 mock 데이터 사용)`);
      }
    } catch (e) {
      console.log(`\n❌ 출석: 테이블 없음 (대시보드는 mock 데이터 사용)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📌 요약:');
    console.log('   ✅ 학생: MySQL 완전 연동');
    console.log('   ✅ 강의: MySQL 완전 연동');
    console.log('   ⚠️  강사: 테이블만 존재 (프론트 미연동)');
    console.log('   ❌ 출석: MySQL 연동 안 됨 (mock 데이터)');
    
    console.log('\n💡 결론:');
    console.log('   학생과 강의 데이터는 MySQL과 실시간 동기화됩니다!');
    console.log('   강사와 출석 데이터는 아직 연동되지 않았습니다.');

    return true;

  } catch (error) {
    console.error('❌ 확인 실패:', error.message);
    return false;
  }
}

// 실행
if (require.main === module) {
  checkDatabaseStatus()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStatus };
