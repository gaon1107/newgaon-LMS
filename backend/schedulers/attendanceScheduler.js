/**
 * 출석 자동 초기화 스케줄러
 *
 * 매일 자정(00:00)에 실행되어:
 * 1. 전날 '등원' 상태로 남아있는 학생들을 '미등원'으로 초기화
 * 2. 새로운 날의 출석 준비
 */

const cron = require('node-cron');
const { db } = require('../config/database');

/**
 * 출석 상태 초기화 함수
 * - 매일 자정에 모든 학생의 출석 상태를 '미등원(absent)'으로 초기화
 * - 오늘의 모든 출석 기록(등원, 외출, 복귀 등)을 '미등원'으로 변경
 * - 새로운 날이 시작되면 모든 학생은 '미등원' 상태에서 시작
 */
async function resetDailyAttendance() {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log('\n========================================');
    console.log('🕛 출석 상태 자동 초기화 시작');
    console.log(`   날짜: ${today}`);
    console.log('========================================\n');

    // 1. 오늘 날짜의 모든 출석 기록 조회
    const [todayRecords] = await db.execute(`
      SELECT
        a.id,
        a.student_id,
        s.name as student_name,
        a.status,
        a.check_in_time,
        a.check_out_time
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = ?
    `, [today]);

    if (todayRecords.length > 0) {
      console.log(`📝 오늘(${today}) 출석 기록 ${todayRecords.length}건 발견`);

      // 상태별 통계
      const statusCount = {
        present: 0,
        absent: 0,
        late: 0,
        early_leave: 0,
        out: 0,
        returned: 0,
        left: 0
      };

      todayRecords.forEach(r => {
        statusCount[r.status] = (statusCount[r.status] || 0) + 1;
      });

      console.log('\n현재 상태 분포:');
      console.table([{
        등원: statusCount.present,
        미등원: statusCount.absent,
        지각: statusCount.late,
        조퇴: statusCount.early_leave,
        외출: statusCount.out,
        복귀: statusCount.returned,
        하원: statusCount.left
      }]);

      // 2. 오늘 날짜의 모든 출석 기록 삭제 (자정에 새로운 날 시작)
      // ✅ 수정: 여러 개의 출입 기록(등원, 외출, 복귀, 하원)이 있으므로 모두 삭제
      const [deleteResult] = await db.execute(`
        DELETE FROM attendance
        WHERE date = ?
      `, [today]);

      console.log(`\n✅ ${deleteResult.affectedRows}건의 출석 기록을 삭제했습니다 (새로운 날 시작)`);
      console.log('   학생들이 등원하면 새로운 출석 기록이 생성됩니다');
    } else {
      console.log(`✅ 오늘(${today})은 아직 출석 기록이 없습니다`);
      console.log('   학생들이 등원하면 새로운 출석 기록이 생성됩니다');
    }

    console.log('\n========================================');
    console.log('✅ 출석 상태 자동 초기화 완료');
    console.log('   모든 학생이 미등원 상태에서 새로운 날을 시작합니다');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ 출석 자동 초기화 중 오류 발생:', error);
    console.error('   에러 상세:', error.message);
    console.error('========================================\n');
  }
}

/**
 * 스케줄러 시작
 * - 매일 자정(00:00)에 실행
 * - Cron 표현식: '0 0 * * *'
 *   - 0: 분 (0분)
 *   - 0: 시 (0시)
 *   - *: 일 (매일)
 *   - *: 월 (매월)
 *   - *: 요일 (매주)
 */
function startAttendanceScheduler() {
  console.log('🕐 출석 자동 초기화 스케줄러 시작');
  console.log('   실행 시간: 매일 00:00 (자정)');
  console.log('   작업 내용: 전날 출석 통계 확인 및 새로운 날 준비');
  console.log('');

  // 매일 자정에 실행
  cron.schedule('0 0 * * *', () => {
    resetDailyAttendance();
  }, {
    timezone: 'Asia/Seoul' // 한국 시간 기준
  });

  // 서버 시작 시 즉시 한 번 실행 (테스트용)
  // resetDailyAttendance();
}

/**
 * 수동 실행 함수 (테스트용)
 */
async function manualReset() {
  console.log('🔧 수동 출석 초기화 실행...\n');
  await resetDailyAttendance();
}

module.exports = {
  startAttendanceScheduler,
  resetDailyAttendance,
  manualReset
};
