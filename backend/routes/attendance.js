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
    const tenant_id = req.user?.tenant_id;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 파라미터 타입 확인
    if (!Number.isInteger(pageNum) || !Number.isInteger(limitNum)) {
      console.error('❌ 페이지네이션 파라미터가 정수가 아닙니다:', { pageNum, limitNum });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: '페이지 번호와 limit은 정수여야 합니다'
        }
      });
    }

    // ✅ WHERE 절 파라미터 분리 (tenant_id 필터 추가)
    let whereCondition = 'WHERE a.tenant_id = ? AND a.date = ?';
    const whereParams = [tenant_id, date];

    if (classId) {
      whereCondition += ' AND l.id = ?';
      whereParams.push(classId);
    }

    // ✅ 출결 데이터 조회 (lecture_id가 NULL인 학원 출석도 포함)
    const attendanceQuery = `
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
        COALESCE(l.name, '학원 출석') as lecture_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN lectures l ON a.lecture_id = l.id
      ${whereCondition}
      ORDER BY a.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN lectures l ON a.lecture_id = l.id
      ${whereCondition}
    `;

    // 파라미터 배열 (LIMIT, OFFSET 제거)
    const attendanceParams = whereParams;
    const countParams = whereParams;

    console.log('🔍 [attendance GET] 디버그 정보:');
    console.log(`   date: ${date}`);
    console.log(`   classId: ${classId}`);
    console.log(`   pageNum: ${pageNum}, limitNum: ${limitNum}, offset: ${offset}`);
    console.log(`   whereParams:`, whereParams);
    console.log(`   attendanceParams:`, attendanceParams);
    console.log(`   쿼리의 ? 개수: ${(attendanceQuery.match(/\?/g) || []).length}`);
    console.log(`   전달된 파라미터 개수: ${attendanceParams.length}`);
    console.log('');

    const [attendanceResult] = await db.execute(attendanceQuery, attendanceParams);
    const [countResult] = await db.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        attendance: attendanceResult,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
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
router.put('/:studentId',
  // 디버그 로그
  (req, res, next) => {
    console.log('📝 [attendance PUT] 요청 수신:', {
      studentId: req.params.studentId,
      body: req.body,
      headers: req.headers.authorization ? '토큰 있음' : '토큰 없음'
    });
    next();
  },
  // 인증 확인
  authenticateToken,
  // 인증 후 확인
  (req, res, next) => {
    console.log('✅ [attendance PUT] 인증 통과, 사용자:', req.user?.username);
    next();
  },
  // 검증 체인
  [
    param('studentId').isInt().withMessage('유효한 학생 ID를 입력해주세요'),
    body('date').isDate().withMessage('유효한 날짜를 입력해주세요'),
    body('lectureId').optional().isInt().withMessage('유효한 강의 ID를 입력해주세요'), // ✅ 학원 출석용으로 optional
    body('status').isIn(['present', 'absent', 'late', 'early_leave', 'out', 'returned', 'left']).withMessage('유효한 출결 상태를 입력해주세요'),
    body('checkInTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('유효한 체크인 시간을 입력해주세요'),
    body('checkOutTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('유효한 체크아웃 시간을 입력해주세요'),
    body('notes').optional().isLength({ max: 500 }).withMessage('비고는 500자 이내로 입력해주세요')
  ],
  // 핸들러 함수
  async (req, res) => {
  console.log('🎯 [attendance PUT] 핸들러 함수 실행 시작');
  console.log('🔍 [attendance PUT] req.params:', req.params);
  console.log('🔍 [attendance PUT] req.body:', req.body);
  console.log('🔍 [attendance PUT] req.user:', req.user);
  try {
    console.log('🔍 [attendance PUT] try 블록 실행');
    const errors = validationResult(req);
    console.log('🔍 [attendance PUT] validationResult 완료:', errors.isEmpty() ? '검증 통과' : '검증 실패');
    if (!errors.isEmpty()) {
      console.log('❌ 검증 오류:', errors.array());
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
    const tenant_id = req.user?.tenant_id;

    // ✅ undefined를 null로 변환 (MySQL은 undefined를 받을 수 없음)
    const safeCheckInTime = checkInTime || null;
    const safeCheckOutTime = checkOutTime || null;
    const safeNotes = notes || null;

    console.log('🔍 [attendance PUT] 처리 중:', {
      studentId,
      tenant_id,
      date,
      lectureId: lectureId || 'NULL (학원 출석)',
      status
    });
    
    if (!tenant_id) {
      console.log('❌ tenant_id 없음');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증 정보가 없습니다'
        }
      });
    }

    // ✅ 해결방법 1: DB에서 학생 존재 여부 확인
    console.log('\n========== 해결방법 1: 학생 존재 여부 확인 =========');
    console.log('🔍 쿼리:', 'SELECT id, name, tenant_id FROM students WHERE id = ? AND tenant_id = ?');
    console.log('🔍 파라미터:', [studentId, tenant_id]);
    const [studentCheck] = await db.execute(
      'SELECT id, name, tenant_id FROM students WHERE id = ? AND tenant_id = ?',
      [studentId, tenant_id]
    );
    console.log('🔍 조회 결과:', studentCheck);
    console.log('========== 해결방법 1 끝 =========\n');
    
    if (studentCheck.length === 0) {
      console.log('❌ 학생을 찾을 수 없음 (ID:', studentId, ', tenant_id:', tenant_id, ')');
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다'
        }
      });
    }

    // ✅ 강의 존재 확인 (lectureId가 있을 경우만)
    if (lectureId) {
      const [lectureCheck] = await db.execute(
        'SELECT id FROM lectures WHERE id = ? AND tenant_id = ?',
        [lectureId, tenant_id]
      );
      if (lectureCheck.length === 0) {
        console.log('❌ 강의를 찾을 수 없음 (ID:', lectureId, ', tenant_id:', tenant_id, ')');
        return res.status(404).json({
          success: false,
          error: {
            code: 'LECTURE_NOT_FOUND',
            message: '강의를 찾을 수 없습니다'
          }
        });
      }
    } else {
      console.log('✅ 학원 출석 기록 (강의 없음)');
    }

    // ✅ 출결 기록 존재 확인 (lecture_id가 NULL일 수 있음)
    let existingRecord;
    if (lectureId) {
      [existingRecord] = await db.execute(
        'SELECT id FROM attendance WHERE tenant_id = ? AND student_id = ? AND lecture_id = ? AND date = ?',
        [tenant_id, studentId, lectureId, date]
      );
    } else {
      // lectureId가 없는 경우 (학원 출석)
      [existingRecord] = await db.execute(
        'SELECT id FROM attendance WHERE tenant_id = ? AND student_id = ? AND lecture_id IS NULL AND date = ?',
        [tenant_id, studentId, date]
      );
    }

    if (existingRecord.length > 0) {
      // 기존 기록 업데이트
      console.log('🔄 기존 기록 업데이트 (등원/하원 시간 보존)');
      // ✅ COALESCE를 사용하여 기존 시간 값 보존
      // - 새로운 값이 null이 아니면 새 값으로 업데이트
      // - 새로운 값이 null이면 기존 값 유지
      if (lectureId) {
        await db.execute(`
          UPDATE attendance
          SET status = ?,
              check_in_time = COALESCE(?, check_in_time),
              check_out_time = COALESCE(?, check_out_time),
              notes = ?,
              updated_at = NOW()
          WHERE tenant_id = ? AND student_id = ? AND lecture_id = ? AND date = ?
        `, [status, safeCheckInTime, safeCheckOutTime, safeNotes, tenant_id, studentId, lectureId, date]);
      } else {
        await db.execute(`
          UPDATE attendance
          SET status = ?,
              check_in_time = COALESCE(?, check_in_time),
              check_out_time = COALESCE(?, check_out_time),
              notes = ?,
              updated_at = NOW()
          WHERE tenant_id = ? AND student_id = ? AND lecture_id IS NULL AND date = ?
        `, [status, safeCheckInTime, safeCheckOutTime, safeNotes, tenant_id, studentId, date]);
      }
    } else {
      // 새 기록 생성
      console.log('➕ 새 기록 생성 (lectureId:', lectureId || 'NULL', ')');
      await db.execute(`
        INSERT INTO attendance (tenant_id, student_id, lecture_id, date, status, check_in_time, check_out_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [tenant_id, studentId, lectureId || null, date, status, safeCheckInTime, safeCheckOutTime, safeNotes]);
    }

    console.log('✅ 출결 상태 업데이트 성공!');
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
      // ✅ 강의별 통계 조회 시 학원 출석(lecture_id NULL) 제외
      statsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id WHERE l.id = ?';
      queryParams.push(classId);
    } else {
      // 전체 통계에는 학원 출석도 포함
      statsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id';
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
    } else {
      // ✅ 전체 통계에는 학원 출석도 포함
      overallStatsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id';
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

    // ✅ 학생별 출결 조회 (학원 출석 포함)
    let attendanceQuery = `
      SELECT
        a.date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.notes,
        COALESCE(l.name, '학원 출석') as lecture_name
      FROM attendance a
      LEFT JOIN lectures l ON a.lecture_id = l.id
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

// 월별 출석 현황 조회
router.get('/monthly', [
  authenticateToken,
  query('yearMonth').matches(/^\d{4}-\d{2}$/).withMessage('유효한 연월 형식을 입력해주세요 (예: 2024-10)')
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

    const { yearMonth } = req.query; // 예: '2024-10'
    const tenant_id = req.user?.tenant_id;

    // 해당 월의 시작일과 종료일 계산
    const startDate = `${yearMonth}-01`;
    const year = parseInt(yearMonth.split('-')[0]);
    const month = parseInt(yearMonth.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    console.log(`📅 월별 출석 조회: ${yearMonth} (${startDate} ~ ${endDate})`);

    // 1. 모든 학생 목록 조회
    const [students] = await db.execute(
      'SELECT id, name, student_number FROM students WHERE tenant_id = ? AND is_active = true ORDER BY name',
      [tenant_id]
    );

    // 2. 해당 월의 모든 출석 기록 조회
    const [attendanceRecords] = await db.execute(`
      SELECT
        student_id,
        DATE_FORMAT(date, '%d') as day,
        status,
        check_in_time,
        check_out_time
      FROM attendance
      WHERE tenant_id = ?
        AND date BETWEEN ? AND ?
      ORDER BY student_id, date
    `, [tenant_id, startDate, endDate]);

    // 3. 학생별로 데이터 구조화
    const monthlyData = students.map(student => {
      const studentAttendance = attendanceRecords.filter(r => r.student_id === student.id);

      // 일별 데이터 매핑
      const daily = {};
      let totalDays = 0;

      studentAttendance.forEach(record => {
        const dayNum = parseInt(record.day);
        console.log(`📝 학생 ${student.name}, ${dayNum}일: check_in=${record.check_in_time}, check_out=${record.check_out_time}, status=${record.status}`);

        // ✅ 월별출석: 등원 시간과 하원 시간만 전달
        // - 등원: check_in_time 그대로
        // - 하원: status가 'left' (하원) 또는 'early_leave' (조퇴)일 때만 check_out_time 전달
        // - 외출('out'), 복귀('returned') 상태는 제외
        const checkOutTime = (record.status === 'left' || record.status === 'early_leave')
          ? record.check_out_time
          : null;

        daily[dayNum] = {
          in: record.check_in_time || null,
          out: checkOutTime,
          status: record.status
        };
        totalDays++;
      });

      return {
        studentId: student.id,
        studentName: student.name,
        studentNumber: student.student_number,
        daily,
        totalDays
      };
    });

    res.json({
      success: true,
      data: {
        yearMonth,
        students: monthlyData,
        totalStudents: students.length
      }
    });

  } catch (error) {
    console.error('월별 출석 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '월별 출석 현황 조회 중 오류가 발생했습니다'
      }
    });
  }
});

module.exports = router;
