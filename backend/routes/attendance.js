const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { query, param, body, validationResult } = require('express-validator');
const { db } = require('../config/database');

console.log('✅ attendance.js 로드됨');

// ====================================
// 1️⃣ 기본 출결 조회
// ====================================
router.get('/', [
  authenticateToken,
  query('date').isDate(),
  query('classId').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

    const { date, classId, page = 1, limit = 20 } = req.query;
    const tenant_id = req.user?.tenant_id;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let where = 'WHERE a.tenant_id = ? AND a.date = ?';
    const params = [tenant_id, date];
    if (classId) { where += ' AND l.id = ?'; params.push(parseInt(classId, 10)); }

    const [attendance] = await db.execute(
      `SELECT a.id, a.student_id, a.lecture_id, a.date, a.status, a.check_in_time, a.check_out_time, a.notes, a.created_at,
        s.name as student_name, COALESCE(l.name, '학원 출석') as lecture_name
       FROM attendance a JOIN students s ON a.student_id = s.id LEFT JOIN lectures l ON a.lecture_id = l.id
       ${where} ORDER BY a.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const countParams = [tenant_id, date];
    if (classId) { countParams.push(parseInt(classId, 10)); }

    const [count] = await db.execute(
      `SELECT COUNT(*) as total FROM attendance a JOIN students s ON a.student_id = s.id LEFT JOIN lectures l ON a.lecture_id = l.id ${where}`,
      countParams
    );

    const total = count[0].total;
    res.json({
      success: true,
      data: {
        attendance,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), hasNext: pageNum < Math.ceil(total / limitNum), hasPrev: pageNum > 1 }
      }
    });
  } catch (error) {
    console.error('❌ 출결 조회 오류:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// ====================================
// 2️⃣ 출결 상태 업데이트
// ====================================
router.put('/:studentId', [
  authenticateToken,
  param('studentId').isInt(),
  body('date').isDate(),
  body('lectureId').optional().isInt(),
  body('status').isIn(['present', 'absent', 'late', 'early_leave', 'out', 'returned', 'left']),
  body('checkInTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('checkOutTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

    const { studentId } = req.params;
    const { date, lectureId, status, checkInTime, checkOutTime, notes } = req.body;
    const tenant_id = req.user?.tenant_id;

    console.log('📝 출결 업데이트:', { studentId, date, status, lectureId });

    if (!tenant_id) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });

    // ✅ SMS 잔액 체크 (등원, 하원 시에만)
    if (['present', 'late', 'left', 'early_leave'].includes(status)) {
      const [tenantInfo] = await db.execute('SELECT sms_balance FROM tenants WHERE id = ?', [tenant_id]);

      if (!tenantInfo || tenantInfo.length === 0) {
        return res.status(500).json({
          success: false,
          error: { code: 'TENANT_NOT_FOUND', message: '학원 정보를 찾을 수 없습니다.' }
        });
      }

      const smsBalance = tenantInfo[0].sms_balance || 0;

      if (smsBalance <= 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_SMS_BALANCE',
            message: 'SMS 잔액이 부족하여 등하원 처리를 할 수 없습니다. SMS를 충전해주세요.'
          }
        });
      }

      console.log(`✅ SMS 잔액 확인: ${smsBalance}건 남음`);
    }

    const [student] = await db.execute('SELECT id FROM students WHERE id = ? AND tenant_id = ?', [studentId, tenant_id]);
    if (student.length === 0) return res.status(404).json({ success: false, error: { code: 'STUDENT_NOT_FOUND' } });

    if (lectureId) {
      const [lecture] = await db.execute('SELECT id FROM lectures WHERE id = ? AND tenant_id = ?', [lectureId, tenant_id]);
      if (lecture.length === 0) return res.status(404).json({ success: false, error: { code: 'LECTURE_NOT_FOUND' } });
    }

    // ✅ 수정: UPDATE 대신 항상 INSERT 사용
    // 이유: 한 학생이 하루에 여러 번의 출입 기록(등원, 외출, 복귀, 하원)을 남길 수 있도록 변경
    // 등원(1번) → 외출/복귀(여러번) → 하원(1번)
    
    // 시간 설정: 등원/지각은 check_in_time, 하원/조퇴는 check_out_time
    let finalCheckInTime = checkInTime;
    let finalCheckOutTime = checkOutTime;
    
    if (['present', 'late'].includes(status)) {
      // 등원/지각: check_in_time만 설정
      finalCheckInTime = checkInTime || new Date().toTimeString().split(' ')[0].slice(0, 5); // HH:mm
      finalCheckOutTime = null;
    } else if (['left', 'early_leave'].includes(status)) {
      // 하원/조퇴: check_out_time만 설정
      finalCheckInTime = null;
      finalCheckOutTime = checkOutTime || new Date().toTimeString().split(' ')[0].slice(0, 5); // HH:mm
    } else if (['out', 'returned'].includes(status)) {
      // 외출/복귀: 시간 기록 (check_in_time에 저장)
      finalCheckInTime = checkInTime || new Date().toTimeString().split(' ')[0].slice(0, 5);
      finalCheckOutTime = null;
    }

    await db.execute(
      `INSERT INTO attendance (tenant_id, student_id, lecture_id, date, status, check_in_time, check_out_time, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenant_id, studentId, lectureId || null, date, status, finalCheckInTime, finalCheckOutTime, notes || null]
    );
    console.log(`✅ 새 출입 기록 생성: ${status} (등원→외출→복귀→하원 이력 추적)`);

    // ✅ SMS 차감 및 발송 로그 기록 (등원, 하원 시에만)
    if (['present', 'late', 'left', 'early_leave'].includes(status)) {
      try {
        // 학생 정보 조회 (학부모 전화번호)
        const [studentInfo] = await db.execute(
          'SELECT name, parent_phone FROM students WHERE id = ? AND tenant_id = ?',
          [studentId, tenant_id]
        );

        if (studentInfo && studentInfo.length > 0 && studentInfo[0].parent_phone) {
          const studentName = studentInfo[0].name;
          const parentPhone = studentInfo[0].parent_phone;
          const messageType = ['present', 'late'].includes(status) ? 'attendance_in' : 'attendance_out';
          const statusText = status === 'present' ? '등원' : status === 'late' ? '지각' : status === 'left' ? '하원' : '조퇴';
          const message = `[알림] ${studentName} 학생이 ${statusText}하였습니다.`;

          // SMS 발송 로그 기록
          await db.execute(
            `INSERT INTO sms_logs (tenant_id, student_id, phone_number, message, message_type, cost, status, sent_at)
             VALUES (?, ?, ?, ?, ?, 1, 'sent', NOW())`,
            [tenant_id, studentId, parentPhone, message, messageType]
          );

          // SMS 잔액 차감
          await db.execute(
            'UPDATE tenants SET sms_balance = sms_balance - 1, updated_at = NOW() WHERE id = ?',
            [tenant_id]
          );

          console.log(`📤 SMS 발송 완료: ${parentPhone} → "${message}" (잔액 -1)`);
        }
      } catch (smsError) {
        console.error('⚠️ SMS 발송/로그 기록 실패:', smsError);
        // SMS 발송 실패해도 출석 기록은 유지
      }
    }

    res.json({ success: true, message: '출결 상태가 업데이트되었습니다' });
  } catch (error) {
    console.error('❌ 출결 업데이트 오류:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// ====================================
// 3️⃣ 월별 출석 조회 (고정 라우트)
// ====================================
router.get('/monthly', [
  authenticateToken,
  query('yearMonth').matches(/^\d{4}-\d{2}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

    const { yearMonth } = req.query;
    const tenant_id = req.user?.tenant_id;
    const startDate = `${yearMonth}-01`;
    const year = parseInt(yearMonth.split('-')[0]);
    const month = parseInt(yearMonth.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    const [students] = await db.execute('SELECT id, name, student_number FROM students WHERE tenant_id = ? AND is_active = true ORDER BY name', [tenant_id]);
    const [records] = await db.execute(
      `SELECT student_id, DATE_FORMAT(date, '%d') as day, status, check_in_time, check_out_time, created_at FROM attendance 
       WHERE tenant_id = ? AND date BETWEEN ? AND ? ORDER BY student_id, date, created_at`,
      [tenant_id, startDate, endDate]
    );

    // ✅ 수정: 하루에 여러 개의 출입 기록(등원, 외출, 복귀, 하원)이 있으므로
    // 월별 화면에는 첫 번째 등원과 마지막 하원만 표시
    const monthlyData = students.map(student => {
      const daily = {};
      const studentRecords = records.filter(r => r.student_id === student.id);
      
      // 날짜별로 그룹화
      const recordsByDay = {};
      studentRecords.forEach(record => {
        const dayNum = parseInt(record.day);
        if (!recordsByDay[dayNum]) recordsByDay[dayNum] = [];
        recordsByDay[dayNum].push(record);
      });
      
      // 각 날짜별로 첫 등원, 마지막 하원만 추출
      Object.keys(recordsByDay).forEach(dayNum => {
        const dayRecords = recordsByDay[dayNum];
        
        // 첫 번째 등원 찾기 (present, late)
        const firstCheckIn = dayRecords.find(r => ['present', 'late'].includes(r.status));
        
        // 마지막 하원 찾기 (left, early_leave)
        const lastCheckOut = [...dayRecords].reverse().find(r => ['left', 'early_leave'].includes(r.status));
        
        daily[dayNum] = {
          in: firstCheckIn ? firstCheckIn.check_in_time : null,
          out: lastCheckOut ? lastCheckOut.check_out_time : null,
          status: lastCheckOut ? lastCheckOut.status : (firstCheckIn ? firstCheckIn.status : null)
        };
      });
      
      // totalDays: 등원한 날 수 (중복 제거)
      const attendedDays = Object.keys(recordsByDay).length;
      
      return { studentId: student.id, studentName: student.name, studentNumber: student.student_number, daily, totalDays: attendedDays };
    });

    res.json({ success: true, data: { yearMonth, students: monthlyData, totalStudents: students.length } });
  } catch (error) {
    console.error('❌ 월별 출석 오류:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// ====================================
// 4️⃣ 출결 통계 조회 (고정 라우트)
// ====================================
router.get('/stats', [
  authenticateToken,
  query('startDate').isDate(),
  query('endDate').isDate(),
  query('classId').optional().isInt(),
  query('studentId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

    const { startDate, endDate, classId, studentId } = req.query;
    const tenant_id = req.user?.tenant_id;

    console.log('📊 출결 통계:', { startDate, endDate, classId, studentId });

    // ✅ 학생별 기본 통계 (간단한 출석률 계산)
    let statsQuery = `SELECT s.id as student_id, s.name as student_name, s.student_number,
      SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days,
      COUNT(DISTINCT a.date) as total_days,
      ROUND(CASE WHEN COUNT(DISTINCT a.date) > 0 THEN (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(DISTINCT a.date)) * 100 ELSE 0 END, 1) as attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.tenant_id = ? AND a.date BETWEEN ? AND ?
      WHERE s.tenant_id = ?`;

    const params = [tenant_id, startDate, endDate, tenant_id];
    if (classId) { statsQuery += ' AND a.lecture_id = ?'; params.push(classId); }
    if (studentId) { statsQuery += ' AND s.id = ?'; params.push(studentId); }
    statsQuery += ` GROUP BY s.id, s.name, s.student_number ORDER BY s.name`;

    const [stats] = await db.execute(statsQuery, params);

    // ✅ 전체 통계 (동일하게 유지)
    let overallQuery = `SELECT COUNT(DISTINCT s.id) as total_students,
      SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as total_present,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as total_late,
      SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as total_early_leave
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.tenant_id = ? AND a.date BETWEEN ? AND ?
      WHERE s.tenant_id = ?`;

    const overallParams = [tenant_id, startDate, endDate, tenant_id];
    if (classId) { overallQuery += ' AND a.lecture_id = ?'; overallParams.push(classId); }
    if (studentId) { overallQuery += ' AND s.id = ?'; overallParams.push(studentId); }

    const [overall] = await db.execute(overallQuery, overallParams);

    // ✅ 날짜별 상세 출석 내역 (날짜별, 강의별 출석 상태)
    let detailQuery = `SELECT
      s.id as student_id,
      s.name as student_name,
      a.date,
      a.status,
      a.check_in_time,
      a.check_out_time,
      l.name as lecture_name,
      a.notes
      FROM attendance a
      JOIN students s ON a.student_id = s.id AND s.tenant_id = ?
      LEFT JOIN lectures l ON a.lecture_id = l.id
      WHERE a.tenant_id = ? AND a.date BETWEEN ? AND ?`;

    const detailParams = [tenant_id, tenant_id, startDate, endDate];
    if (classId) { detailQuery += ' AND a.lecture_id = ?'; detailParams.push(classId); }
    if (studentId) { detailQuery += ' AND a.student_id = ?'; detailParams.push(studentId); }
    detailQuery += ` ORDER BY a.date DESC, s.name, a.check_in_time`;

    const [detailedRecords] = await db.execute(detailQuery, detailParams);

    res.json({
      success: true,
      data: {
        studentStats: stats,
        overallStats: overall[0],
        detailedRecords: detailedRecords,
        period: { startDate, endDate, classId, studentId }
      }
    });
  } catch (error) {
    console.error('❌ 통계 조회 오류:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// ====================================
// 5️⃣ 학생별 출결 조회 (파라미터 라우트)
// ====================================
router.get('/student/:studentId', [
  authenticateToken,
  param('studentId').isInt(),
  query('startDate').optional().isDate(),
  query('endDate').optional().isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const [student] = await db.execute('SELECT name FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) return res.status(404).json({ success: false, error: { code: 'STUDENT_NOT_FOUND' } });

    let query = `SELECT a.date, a.status, a.check_in_time, a.check_out_time, a.notes, COALESCE(l.name, '학원 출석') as lecture_name
      FROM attendance a LEFT JOIN lectures l ON a.lecture_id = l.id WHERE a.student_id = ?`;
    
    const params = [studentId];
    if (startDate && endDate) { query += ' AND a.date BETWEEN ? AND ?'; params.push(startDate, endDate); }
    query += ' ORDER BY a.date DESC';

    const [attendance] = await db.execute(query, params);

    res.json({ success: true, data: { student: student[0], attendance } });
  } catch (error) {
    console.error('❌ 학생 출결 오류:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
  }
});

module.exports = router;
