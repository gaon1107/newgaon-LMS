const { query } = require('../config/database');

async function checkAttendanceToday() {
  try {
    console.log('2025-10-24 출석 데이터 조회 중...\n');

    const attendances = await query(`
      SELECT * FROM attendance
      WHERE date = '2025-10-24'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (!attendances || attendances.length === 0) {
      console.log('❌ 2025-10-24 날짜의 출석 데이터가 없습니다.\n');

      // 최근 출석 데이터 확인
      console.log('최근 출석 데이터 5개 조회...\n');
      const recentAttendances = await query(`
        SELECT * FROM attendance
        ORDER BY created_at DESC
        LIMIT 5
      `);

      if (recentAttendances && recentAttendances.length > 0) {
        console.log('최근 출석 데이터:');
        console.log('┌──────┬─────────────┬─────────────┬─────────────┬────────┬─────────────────────┐');
        console.log('│ ID   │ Student ID  │ Lecture ID  │ Date        │ Status │ Created At          │');
        console.log('├──────┼─────────────┼─────────────┼─────────────┼────────┼─────────────────────┤');

        recentAttendances.forEach(att => {
          const id = String(att.id || '-').padEnd(6);
          const studentId = String(att.student_id || '-').padEnd(11);
          const lectureId = String(att.lecture_id || '-').padEnd(11);
          const date = String(att.date || '-').padEnd(11);
          const status = String(att.status || '-').padEnd(6);
          const createdAt = att.created_at ? new Date(att.created_at).toLocaleString('ko-KR') : '-';
          console.log(`│ ${id}│ ${studentId}│ ${lectureId}│ ${date}│ ${status}│ ${createdAt.padEnd(19)}│`);
        });

        console.log('└──────┴─────────────┴─────────────┴─────────────┴────────┴─────────────────────┘\n');
      }

      process.exit(0);
    }

    console.log('✅ 2025-10-24 출석 데이터 (최근 5개):');
    console.log('┌──────┬─────────────┬─────────────┬─────────────┬────────┬─────────────────────┐');
    console.log('│ ID   │ Student ID  │ Lecture ID  │ Date        │ Status │ Created At          │');
    console.log('├──────┼─────────────┼─────────────┼─────────────┼────────┼─────────────────────┤');

    attendances.forEach(att => {
      const id = String(att.id || '-').padEnd(6);
      const studentId = String(att.student_id || '-').padEnd(11);
      const lectureId = String(att.lecture_id || '-').padEnd(11);
      const date = String(att.date || '-').padEnd(11);
      const status = String(att.status || '-').padEnd(6);
      const createdAt = att.created_at ? new Date(att.created_at).toLocaleString('ko-KR') : '-';
      console.log(`│ ${id}│ ${studentId}│ ${lectureId}│ ${date}│ ${status}│ ${createdAt.padEnd(19)}│`);
    });

    console.log('└──────┴─────────────┴─────────────┴─────────────┴────────┴─────────────────────┘\n');

    // 통계 정보
    const stats = await query(`
      SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
      FROM attendance
      WHERE date = '2025-10-24'
    `);

    if (stats && stats.length > 0) {
      console.log('📊 2025-10-24 출석 통계:');
      console.log(`   총 출석 기록: ${stats[0].total_count}개`);
      console.log(`   출석: ${stats[0].present_count}명`);
      console.log(`   결석: ${stats[0].absent_count}명`);
      console.log(`   지각: ${stats[0].late_count}명\n`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkAttendanceToday();
}

module.exports = { checkAttendanceToday };
