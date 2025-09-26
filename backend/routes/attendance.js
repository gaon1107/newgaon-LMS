const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { query, param, body, validationResult } = require('express-validator');
const { db } = require('../config/database');

// 출결 데이터 조회
router.get('/', [
  authenticateToken,
  query('date').isDate().withMessage('유효한 날짜를 입력해주세요'),
  query('classId').optional().isInt().withMessage('유효한 수업 ID를 입력해주세요'),
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit은 1-100 사이여야 합니다')
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

    const { date, classId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let attendanceQuery = `
      SELECT
        a.id,
        a.student_id,
        a.lecture_id,
        a.date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.notes,
        a.created_at,
        s.name as student_name,
        s.student_number,
        l.name as lecture_name,
        l.subject_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN lectures l ON a.lecture_id = l.id
      WHERE a.date = ?
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN lectures l ON a.lecture_id = l.id
      WHERE a.date = ?
    `;

    const queryParams = [date];

    if (classId) {
      attendanceQuery += ' AND l.id = ?';
      countQuery += ' AND l.id = ?';
      queryParams.push(classId);
    }

    attendanceQuery += ' ORDER BY s.name, l.name LIMIT ? OFFSET ?';

    const [attendanceResult] = await db.execute(attendanceQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await db.execute(countQuery, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        attendance: attendanceResult,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('출결 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '출결 데이터 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 출결 상태 업데이트
router.put('/:studentId', [
  authenticateToken,
  param('studentId').isInt().withMessage('유효한 학생 ID를 입력해주세요'),
  body('date').isDate().withMessage('유효한 날짜를 입력해주세요'),
  body('lectureId').isInt().withMessage('유효한 강의 ID를 입력해주세요'),
  body('status').isIn(['present', 'absent', 'late', 'early_leave']).withMessage('유효한 출결 상태를 입력해주세요'),
  body('checkInTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('유효한 체크인 시간을 입력해주세요'),
  body('checkOutTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('유효한 체크아웃 시간을 입력해주세요'),
  body('notes').optional().isLength({ max: 500 }).withMessage('비고는 500자 이내로 입력해주세요')
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

    const { studentId } = req.params;
    const { date, lectureId, status, checkInTime, checkOutTime, notes } = req.body;

    // 학생과 강의 존재 확인
    const [studentCheck] = await db.execute('SELECT id FROM students WHERE id = ?', [studentId]);
    if (studentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다'
        }
      });
    }

    const [lectureCheck] = await db.execute('SELECT id FROM lectures WHERE id = ?', [lectureId]);
    if (lectureCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LECTURE_NOT_FOUND',
          message: '강의를 찾을 수 없습니다'
        }
      });
    }

    // 출결 기록 존재 확인
    const [existingRecord] = await db.execute(
      'SELECT id FROM attendance WHERE student_id = ? AND lecture_id = ? AND date = ?',
      [studentId, lectureId, date]
    );

    if (existingRecord.length > 0) {
      // 기존 기록 업데이트
      await db.execute(`
        UPDATE attendance
        SET status = ?, check_in_time = ?, check_out_time = ?, notes = ?, updated_at = NOW()
        WHERE student_id = ? AND lecture_id = ? AND date = ?
      `, [status, checkInTime, checkOutTime, notes, studentId, lectureId, date]);
    } else {
      // 새 기록 생성
      await db.execute(`
        INSERT INTO attendance (student_id, lecture_id, date, status, check_in_time, check_out_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [studentId, lectureId, date, status, checkInTime, checkOutTime, notes]);
    }

    res.json({
      success: true,
      message: '출결 상태가 성공적으로 업데이트되었습니다'
    });

  } catch (error) {
    console.error('출결 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '출결 상태 업데이트 중 오류가 발생했습니다'
      }
    });
  }
});

// 출결 통계 조회
router.get('/stats', [
  authenticateToken,
  query('startDate').isDate().withMessage('유효한 시작 날짜를 입력해주세요'),
  query('endDate').isDate().withMessage('유효한 종료 날짜를 입력해주세요'),
  query('classId').optional().isInt().withMessage('유효한 수업 ID를 입력해주세요')
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

    const { startDate, endDate, classId } = req.query;

    let statsQuery = `
      SELECT
        s.id as student_id,
        s.name as student_name,
        s.student_number,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) as attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
        AND a.date BETWEEN ? AND ?
    `;

    const queryParams = [startDate, endDate];

    if (classId) {
      statsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id WHERE l.id = ?';
      queryParams.push(classId);
    }

    statsQuery += `
      GROUP BY s.id, s.name, s.student_number
      ORDER BY s.name
    `;

    const [statsResult] = await db.execute(statsQuery, queryParams);

    // 전체 통계
    let overallStatsQuery = `
      SELECT
        COUNT(DISTINCT s.id) as total_students,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as total_late,
        SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as total_early_leave,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) as overall_attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
        AND a.date BETWEEN ? AND ?
    `;

    if (classId) {
      overallStatsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id WHERE l.id = ?';
    }

    const [overallResult] = await db.execute(overallStatsQuery, queryParams);

    res.json({
      success: true,
      data: {
        studentStats: statsResult,
        overallStats: overallResult[0],
        period: {
          startDate,
          endDate,
          classId: classId || null
        }
      }
    });

  } catch (error) {
    console.error('출결 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '출결 통계 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 학생별 출결 현황 조회
router.get('/student/:studentId', [
  authenticateToken,
  param('studentId').isInt().withMessage('유효한 학생 ID를 입력해주세요'),
  query('startDate').optional().isDate().withMessage('유효한 시작 날짜를 입력해주세요'),
  query('endDate').optional().isDate().withMessage('유효한 종료 날짜를 입력해주세요')
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

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // 학생 존재 확인
    const [studentCheck] = await db.execute('SELECT name FROM students WHERE id = ?', [studentId]);
    if (studentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다'
        }
      });
    }

    let attendanceQuery = `
      SELECT
        a.date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.notes,
        l.name as lecture_name,
        l.subject_name
      FROM attendance a
      JOIN lectures l ON a.lecture_id = l.id
      WHERE a.student_id = ?
    `;

    const queryParams = [studentId];

    if (startDate && endDate) {
      attendanceQuery += ' AND a.date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    attendanceQuery += ' ORDER BY a.date DESC';

    const [attendanceResult] = await db.execute(attendanceQuery, queryParams);

    res.json({
      success: true,
      data: {
        student: studentCheck[0],
        attendance: attendanceResult
      }
    });

  } catch (error) {
    console.error('학생 출결 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 출결 현황 조회 중 오류가 발생했습니다'
      }
    });
  }
});

module.exports = router;