const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { query, validationResult } = require('express-validator');
const { db } = require('../config/database');

// 대시보드 통계 조회
router.get('/stats', [
  authenticateToken
], async (req, res) => {
  try {
    // 현재 날짜 정보
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    const currentDate = today.toISOString().split('T')[0];

    // 기본 통계 조회 (학생, 강사, 강의 수)
    const [basicStats] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'instructor' AND status = 'active') as total_instructors,
        (SELECT COUNT(*) FROM lectures WHERE status = 'active') as total_lectures,
        (SELECT COUNT(*) FROM lectures WHERE status = 'active' AND start_date <= CURDATE() AND end_date >= CURDATE()) as active_lectures
    `);

    // 오늘 출결 통계
    const [todayAttendance] = await db.execute(`
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
        ROUND(
          (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
          2
        ) as attendance_rate
      FROM attendance
      WHERE date = ?
    `, [currentDate]);

    // 이번 달 출결 통계
    const [monthlyAttendance] = await db.execute(`
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
        ROUND(
          (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
          2
        ) as attendance_rate
      FROM attendance
      WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [currentMonth]);

    // 최근 7일 출결 추이
    const [weeklyTrend] = await db.execute(`
      SELECT
        date,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        ROUND(
          (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
          2
        ) as attendance_rate
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date DESC
    `);

    // 강의별 출석률 상위 5개
    const [topLectures] = await db.execute(`
      SELECT
        l.name as lecture_name,
        l.subject_name,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) as attendance_rate
      FROM lectures l
      LEFT JOIN attendance a ON l.id = a.lecture_id
        AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE l.status = 'active'
      GROUP BY l.id, l.name, l.subject_name
      HAVING total_records > 0
      ORDER BY attendance_rate DESC
      LIMIT 5
    `);

    // 출석률 낮은 학생 상위 5명
    const [lowAttendanceStudents] = await db.execute(`
      SELECT
        s.name as student_name,
        s.student_number,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) as attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
        AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.student_number
      HAVING total_records > 0
      ORDER BY attendance_rate ASC
      LIMIT 5
    `);

    // 최근 메시지 발송 통계
    const [messageStats] = await db.execute(`
      SELECT
        COUNT(*) as total_messages,
        SUM(recipient_count) as total_recipients,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(total_cost) as total_cost
      FROM messages
      WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
    `, [currentMonth]);

    res.json({
      success: true,
      data: {
        basicStats: {
          totalStudents: basicStats[0].total_students,
          totalInstructors: basicStats[0].total_instructors,
          totalLectures: basicStats[0].total_lectures,
          activeLectures: basicStats[0].active_lectures
        },
        todayAttendance: {
          totalRecords: todayAttendance[0].total_records || 0,
          presentCount: todayAttendance[0].present_count || 0,
          absentCount: todayAttendance[0].absent_count || 0,
          lateCount: todayAttendance[0].late_count || 0,
          earlyLeaveCount: todayAttendance[0].early_leave_count || 0,
          attendanceRate: todayAttendance[0].attendance_rate || 0
        },
        monthlyAttendance: {
          totalRecords: monthlyAttendance[0].total_records || 0,
          presentCount: monthlyAttendance[0].present_count || 0,
          absentCount: monthlyAttendance[0].absent_count || 0,
          lateCount: monthlyAttendance[0].late_count || 0,
          earlyLeaveCount: monthlyAttendance[0].early_leave_count || 0,
          attendanceRate: monthlyAttendance[0].attendance_rate || 0
        },
        weeklyTrend,
        topLectures,
        lowAttendanceStudents,
        messageStats: {
          totalMessages: messageStats[0].total_messages || 0,
          totalRecipients: messageStats[0].total_recipients || 0,
          sentCount: messageStats[0].sent_count || 0,
          failedCount: messageStats[0].failed_count || 0,
          totalCost: messageStats[0].total_cost || 0
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '대시보드 통계 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 최근 활동 조회
router.get('/activities', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit은 1-50 사이여야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { limit = 10 } = req.query;

    // 최근 활동들을 UNION으로 통합 조회
    const [activities] = await db.execute(`
      (
        SELECT
          'student_created' as activity_type,
          CONCAT('새로운 학생이 등록되었습니다: ', name) as description,
          name as subject_name,
          created_at as activity_time
        FROM students
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
      UNION ALL
      (
        SELECT
          'lecture_created' as activity_type,
          CONCAT('새로운 강의가 개설되었습니다: ', name) as description,
          name as subject_name,
          created_at as activity_time
        FROM lectures
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
      UNION ALL
      (
        SELECT
          'message_sent' as activity_type,
          CONCAT('메시지가 발송되었습니다: ', title) as description,
          title as subject_name,
          created_at as activity_time
        FROM messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND status = 'sent'
      )
      UNION ALL
      (
        SELECT
          'file_uploaded' as activity_type,
          CONCAT('파일이 업로드되었습니다: ', original_name) as description,
          original_name as subject_name,
          created_at as activity_time
        FROM files
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
      ORDER BY activity_time DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        activities: activities.map(activity => ({
          type: activity.activity_type,
          description: activity.description,
          subjectName: activity.subject_name,
          time: activity.activity_time,
          timeAgo: getTimeAgo(activity.activity_time)
        }))
      }
    });

  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '최근 활동 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 출결 현황 차트 데이터
router.get('/attendance-chart', [
  authenticateToken,
  query('period').optional().isIn(['week', 'month', 'quarter']).withMessage('유효한 기간을 선택해주세요'),
  query('type').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('유효한 타입을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { period = 'month', type = 'daily' } = req.query;

    let dateRange, groupBy, dateFormat;

    switch (period) {
      case 'week':
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'quarter':
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      default: // month
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    }

    switch (type) {
      case 'weekly':
        groupBy = 'YEARWEEK(date)';
        dateFormat = 'CONCAT(YEAR(date), "-W", WEEK(date))';
        break;
      case 'monthly':
        groupBy = 'DATE_FORMAT(date, "%Y-%m")';
        dateFormat = 'DATE_FORMAT(date, "%Y-%m")';
        break;
      default: // daily
        groupBy = 'date';
        dateFormat = 'date';
    }

    const [chartData] = await db.execute(`
      SELECT
        ${dateFormat} as period,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
        ROUND(
          (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100,
          2
        ) as attendance_rate
      FROM attendance
      WHERE date >= ${dateRange}
      GROUP BY ${groupBy}
      ORDER BY period
    `);

    res.json({
      success: true,
      data: {
        chartData,
        summary: {
          period,
          type,
          totalPeriods: chartData.length,
          averageAttendanceRate: chartData.length > 0
            ? chartData.reduce((sum, item) => sum + parseFloat(item.attendance_rate), 0) / chartData.length
            : 0
        }
      }
    });

  } catch (error) {
    console.error('출결 차트 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '출결 차트 데이터 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 강의별 통계
router.get('/lecture-stats', [
  authenticateToken,
  query('period').optional().isIn(['week', 'month', 'quarter']).withMessage('유효한 기간을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { period = 'month' } = req.query;

    let dateRange;
    switch (period) {
      case 'week':
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'quarter':
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      default: // month
        dateRange = 'DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    }

    const [lectureStats] = await db.execute(`
      SELECT
        l.id,
        l.name as lecture_name,
        l.subject_name,
        l.schedule_type,
        l.status,
        u.name as instructor_name,
        COUNT(DISTINCT a.student_id) as enrolled_students,
        COUNT(a.id) as total_attendance_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
        ROUND(
          CASE
            WHEN COUNT(a.id) > 0 THEN
              (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100
            ELSE 0
          END,
          2
        ) as attendance_rate
      FROM lectures l
      LEFT JOIN users u ON l.instructor_id = u.id
      LEFT JOIN attendance a ON l.id = a.lecture_id
        AND a.date >= ${dateRange}
      WHERE l.status = 'active'
      GROUP BY l.id, l.name, l.subject_name, l.schedule_type, l.status, u.name
      ORDER BY attendance_rate DESC, l.name
    `);

    res.json({
      success: true,
      data: {
        lectures: lectureStats,
        summary: {
          totalLectures: lectureStats.length,
          averageAttendanceRate: lectureStats.length > 0
            ? lectureStats.reduce((sum, item) => sum + parseFloat(item.attendance_rate || 0), 0) / lectureStats.length
            : 0,
          topPerformingLecture: lectureStats.length > 0 ? lectureStats[0] : null,
          period
        }
      }
    });

  } catch (error) {
    console.error('강의별 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '강의별 통계 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 시간 차이 계산 헬퍼 함수
function getTimeAgo(date) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMs = now - activityDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return activityDate.toLocaleDateString('ko-KR');
  }
}

module.exports = router;