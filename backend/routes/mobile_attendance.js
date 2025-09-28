const express = require('express');
const router = express.Router();
const StudentModel = require('../models/studentModel');
const { query, transaction } = require('../config/database');

// 출결번호로 학생 인증
router.post('/auth/attendance-number', async (req, res) => {
  try {
    const { attendanceNumber } = req.body;

    if (!attendanceNumber) {
      return res.status(400).json({
        success: false,
        message: '출결번호를 입력해주세요.'
      });
    }

    // 4자리 숫자 확인
    if (!/^\d{4}$/.test(attendanceNumber)) {
      return res.status(400).json({
        success: false,
        message: '출결번호는 4자리 숫자여야 합니다.'
      });
    }

    const student = await StudentModel.getStudentByAttendanceNumber(attendanceNumber);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '등록되지 않은 출결번호입니다.'
      });
    }

    res.json({
      success: true,
      message: '인증 성공',
      data: {
        studentId: student.id,
        name: student.name,
        attendanceNumber: student.attendance_number,
        profileImage: student.profile_image_url,
        class: student.class
      }
    });

  } catch (error) {
    console.error('Mobile attendance auth error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 얼굴인식 인증 (얼굴 데이터로 학생 조회)
router.post('/auth/face-recognition', async (req, res) => {
  try {
    const { faceData, deviceId } = req.body;

    if (!faceData) {
      return res.status(400).json({
        success: false,
        message: '얼굴 데이터가 필요합니다.'
      });
    }

    // TODO: 얼굴인식 라이브러리 연동
    // 실제 구현에서는 얼굴인식 서비스(FaceNet, AWS Rekognition 등)와 연동
    // 현재는 mock 데이터로 테스트

    // 임시: 첫 번째 활성 학생 반환 (실제로는 얼굴인식 결과 사용)
    const students = await query(`
      SELECT * FROM students
      WHERE is_active = true
      ORDER BY created_at
      LIMIT 1
    `);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: '등록된 학생을 찾을 수 없습니다.'
      });
    }

    const student = await StudentModel.getStudentById(students[0].id);

    res.json({
      success: true,
      message: '얼굴인식 인증 성공',
      data: {
        studentId: student.id,
        name: student.name,
        attendanceNumber: student.attendance_number,
        profileImage: student.profile_image_url,
        class: student.class,
        confidence: 0.95 // 인식 신뢰도
      }
    });

  } catch (error) {
    console.error('Face recognition auth error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 출결 기록 추가 (모바일 앱용)
router.post('/record', async (req, res) => {
  try {
    const {
      studentId,
      stateDescription,
      deviceId,
      isKeypad = true, // 출결번호 입력: true, 얼굴인식: false
      thumbnailData,
      comment
    } = req.body;

    if (!studentId || !stateDescription) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      });
    }

    // 학생 정보 확인
    const student = await StudentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '학생을 찾을 수 없습니다.'
      });
    }

    // 출결 기록 추가
    const result = await transaction(async (conn) => {
      const insertQuery = `
        INSERT INTO attendance_records (
          student_id, student_name, class_name, state_description,
          tagged_at, is_keypad, device_id, comment, thumbnail_data
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)
      `;

      const [insertResult] = await conn.execute(insertQuery, [
        studentId,
        student.name,
        student.class,
        stateDescription,
        isKeypad,
        deviceId || null,
        comment || null,
        thumbnailData || null
      ]);

      return insertResult.insertId;
    });

    res.json({
      success: true,
      message: '출결 기록이 추가되었습니다.',
      data: {
        recordId: result,
        studentName: student.name,
        stateDescription,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Mobile attendance record error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 학생별 최근 출결 기록 조회
router.get('/records/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10 } = req.query;

    const records = await query(`
      SELECT
        id, state_description, tagged_at, is_keypad,
        device_id, comment, thumbnail_data
      FROM attendance_records
      WHERE student_id = ?
      ORDER BY tagged_at DESC
      LIMIT ?
    `, [studentId, parseInt(limit)]);

    res.json({
      success: true,
      data: records
    });

  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 출결번호 중복 확인
router.get('/check-attendance-number/:number', async (req, res) => {
  try {
    const { number } = req.params;

    if (!/^\d{4}$/.test(number)) {
      return res.status(400).json({
        success: false,
        message: '출결번호는 4자리 숫자여야 합니다.'
      });
    }

    const exists = await StudentModel.checkAttendanceNumberExists(number);

    res.json({
      success: true,
      exists,
      message: exists ? '이미 사용 중인 출결번호입니다.' : '사용 가능한 출결번호입니다.'
    });

  } catch (error) {
    console.error('Check attendance number error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;