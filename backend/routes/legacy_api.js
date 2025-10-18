const express = require('express');
const { query } = require('../config/database');
const { generateTokens, verifyRefreshToken, authenticateToken } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * 레거시 API 응답 형식 변환 함수
 */
const formatLegacyResponse = (success, data = null, error = null) => {
  const response = {
    success: success,
    header: {
      result: success ? "SUCCESS" : "ERROR",
      resultCode: success ? "0000" : "9999",
      message: success ? "성공" : (error?.message || "오류가 발생했습니다.")
    }
  };

  if (success && data) {
    response.data = data;
  }

  if (!success && error) {
    response.error = error.message;
    response.errorCode = error.code || "UNKNOWN_ERROR";
    response.errorMessage = error.message;
  }

  return response;
};

/**
 * @route   POST /api/d/1.0/login
 * @desc    기존 앱 호환 로그인 API
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력값 검증
    if (!username || !password) {
      return res.status(400).json(formatLegacyResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: '사용자명과 비밀번호를 입력해주세요.'
      }));
    }

    // 사용자 조회
    const users = await query(
      'SELECT id, username, password_hash, name, email, role, is_active FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json(formatLegacyResponse(false, null, {
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      }));
    }

    const user = users[0];

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return res.status(401).json(formatLegacyResponse(false, null, {
        code: 'ACCOUNT_DISABLED',
        message: '비활성화된 계정입니다.'
      }));
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json(formatLegacyResponse(false, null, {
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      }));
    }

    // JWT 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user);

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 기존 앱 호환 응답 형식
    const responseData = {
      accessToken,
      refreshToken,
      scope: "admin", // 기존 앱에서 사용하던 scope 값
      userInfo: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.json(formatLegacyResponse(true, responseData));

    console.log(`✅ 레거시 로그인 성공: ${user.username} (${user.name})`);

  } catch (error) {
    console.error('Legacy login error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '로그인 처리 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/refresh
 * @desc    기존 앱 호환 토큰 갱신 API
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.body;

    if (!clientRefreshToken) {
      return res.status(400).json(formatLegacyResponse(false, null, {
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh Token이 필요합니다.'
      }));
    }

    // Refresh Token 검증
    let decoded;
    try {
      decoded = verifyRefreshToken(clientRefreshToken);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(formatLegacyResponse(false, null, {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh Token이 만료되었습니다.'
        }));
      }

      return res.status(401).json(formatLegacyResponse(false, null, {
        code: 'REFRESH_TOKEN_INVALID',
        message: '유효하지 않은 Refresh Token입니다.'
      }));
    }

    // 사용자 정보 재조회
    const users = await query(
      'SELECT id, username, name, email, role, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json(formatLegacyResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: '유효하지 않은 사용자입니다.'
      }));
    }

    const user = users[0];

    // 새로운 토큰 생성
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // 기존 앱 호환 응답 형식
    const responseData = {
      accessToken,
      refreshToken: newRefreshToken,
      scope: "admin",
      userInfo: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.json(formatLegacyResponse(true, responseData));

    console.log(`✅ 레거시 토큰 갱신 성공: ${user.username}`);

  } catch (error) {
    console.error('Legacy token refresh error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '토큰 갱신 처리 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/user
 * @desc    기존 앱 호환 사용자 정보 조회 API
 * @access  Private
 */
router.post('/user', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // 최신 사용자 정보 재조회
    const users = await query(
      'SELECT id, username, name, email, role, is_active, last_login_at, created_at FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json(formatLegacyResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.'
      }));
    }

    const userData = users[0];

    // 라이선스 정보 조회 (데이터베이스에서)
    const licenses = await query(
      `SELECT 
        license_type,
        license_key,
        end_date,
        DATEDIFF(end_date, CURDATE()) as remaining_days,
        is_active
      FROM licenses 
      WHERE user_id = ? AND is_active = TRUE`,
      [user.id]
    );

    // 출석 라이선스 찾기
    const attendLicense = licenses.find(l => l.license_type === 'attend');

    // 기존 앱 호환 응답 형식 (라이선스 정보 포함)
    const responseData = {
      userInfo: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isActive: userData.is_active,
        lastLoginAt: userData.last_login_at,
        createdAt: userData.created_at
      }
    };

    const responseWithHeader = formatLegacyResponse(true, responseData);

    // 안드로이드 앱이 기대하는 헤더 정보 추가
    responseWithHeader.header.appVersion = "1.0.0";
    responseWithHeader.header.licenses = {
      attend: attendLicense ? {
        license: attendLicense.license_key,
        licenseTo: attendLicense.end_date,  // Date 객체로 전달 (Gson이 자동 변환)
        remainingDays: attendLicense.remaining_days
      } : {
        license: null,
        licenseTo: null,
        remainingDays: 0
      }
    };

    console.log(`✅ 레거시 사용자 정보 조회: ${userData.username}, 라이선스 잔여일: ${attendLicense ? attendLicense.remaining_days : 0}일`);

    // 디버깅: 실제 응답 구조 로깅
    console.log('=== 앱으로 전송되는 응답 ===');
    console.log('header.licenses.attend:', JSON.stringify(responseWithHeader.header.licenses.attend, null, 2));
    console.log('========================');

    res.json(responseWithHeader);

  } catch (error) {
    console.error('Legacy get user error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/version
 * @desc    기존 앱 호환 버전 정보 API
 * @access  Private
 */
router.post('/version', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // 라이선스 정보 조회 (user API와 동일하게)
    const licenses = await query(
      `SELECT 
        license_type,
        license_key,
        end_date,
        DATEDIFF(end_date, CURDATE()) as remaining_days,
        is_active
      FROM licenses 
      WHERE user_id = ? AND is_active = TRUE`,
      [user.id]
    );

    // 출석 라이선스 찾기
    const attendLicense = licenses.find(l => l.license_type === 'attend');

    // 버전 정보 (필요에 따라 데이터베이스에서 조회하도록 변경 가능)
    const versionData = {
      version: "1.0.0",
      dataVersion: "1.0.0",  // 앱에서 필요한 데이터 버전 추가
      minVersion: "1.0.0",
      updateRequired: false,
      updateUrl: null,
      releaseNotes: "새로운 LMS 시스템으로 업데이트되었습니다."
    };

    const response = formatLegacyResponse(true, versionData);

    // ✅ 라이선스 정보를 header에 추가 (user API와 동일)
    response.header.appVersion = "1.0.0";
    response.header.licenses = {
      attend: attendLicense ? {
        license: attendLicense.license_key,
        licenseTo: attendLicense.end_date,
        remainingDays: attendLicense.remaining_days
      } : {
        license: null,
        licenseTo: null,
        remainingDays: 0
      }
    };

    console.log(`✅ 버전 정보 조회: 라이선스 잔여일 ${attendLicense ? attendLicense.remaining_days : 0}일`);

    res.json(response);

  } catch (error) {
    console.error('Legacy version error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '버전 정보 조회 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/student/get/all
 * @desc    기존 앱 호환 전체 학생 목록 조회 API
 * @access  Private
 */
router.post('/student/get/all', authenticateToken, async (req, res) => {
  try {
    // 모든 활성 학생 조회
    const students = await query(`
      SELECT 
        s.id,
        s.attendance_number as identifier,
        s.name,
        s.parent_phone as mobile,
        1 as epiVersion,
        COALESCE(a.status, 0) as state,
        COALESCE(a.status, 0) as currentState
      FROM students s
      LEFT JOIN attendance_logs a ON s.id = a.student_id 
        AND DATE(a.created_at) = CURDATE()
      WHERE s.is_active = true
      ORDER BY s.name
    `);

    // 기존 앱 호환 형식으로 변환
    const legacyStudents = students.map(student => ({
      id: student.id.toString(),
      identifier: student.identifier,
      name: student.name,
      mobile: student.mobile,
      epiVersion: student.epiVersion,
      state: student.state,
      currentState: student.currentState,
      validStates: [0, 1, 2, 3, 4] // 출석 상태 (미출석, 출석, 지각, 조퇴, 결석)
    }));

    res.json(formatLegacyResponse(true, legacyStudents));

    console.log(`✅ 레거시 전체 학생 조회: ${legacyStudents.length}명`);
    console.log('📋 학생 목록:', legacyStudents.map(s => `${s.identifier} - ${s.name}`).join(', '));

  } catch (error) {
    console.error('Legacy get all students error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '학생 목록 조회 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/student/get
 * @desc    기존 앱 호환 특정 학생 정보 조회 API
 * @access  Private
 */
router.post('/student/get', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json(formatLegacyResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: '학생 ID가 필요합니다.'
      }));
    }

    // 학생 정보 조회
    const students = await query(`
      SELECT 
        s.id,
        s.attendance_number as identifier,
        s.name,
        s.parent_phone as mobile,
        1 as epiVersion,
        COALESCE(a.status, 0) as state,
        COALESCE(a.status, 0) as currentState
      FROM students s
      LEFT JOIN attendance_logs a ON s.id = a.student_id 
        AND DATE(a.created_at) = CURDATE()
      WHERE s.id = ? AND s.is_active = true
    `, [id]);

    if (students.length === 0) {
      return res.status(404).json(formatLegacyResponse(false, null, {
        code: 'STUDENT_NOT_FOUND',
        message: '학생을 찾을 수 없습니다.'
      }));
    }

    const student = students[0];

    // 기존 앱 호환 형식으로 변환
    const legacyStudent = {
      id: student.id.toString(),
      identifier: student.identifier,
      name: student.name,
      mobile: student.mobile,
      epiVersion: student.epiVersion,
      state: student.state,
      currentState: student.currentState,
      validStates: [0, 1, 2, 3, 4]
    };

    res.json(formatLegacyResponse(true, legacyStudent));

    console.log(`✅ 레거시 학생 조회: ${student.name} (ID: ${id})`);

  } catch (error) {
    console.error('Legacy get student error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '학생 정보 조회 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/student/state/set
 * @desc    기존 앱 호환 학생 출석 상태 설정 API
 * @access  Private
 */
router.post('/student/state/set', authenticateToken, async (req, res) => {
  try {
    const { id, state } = req.body;

    if (!id || state === undefined) {
      return res.status(400).json(formatLegacyResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: '학생 ID와 상태가 필요합니다.'
      }));
    }

    // 학생 존재 확인
    const students = await query(
      'SELECT id, name FROM students WHERE id = ? AND is_active = true',
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json(formatLegacyResponse(false, null, {
        code: 'STUDENT_NOT_FOUND',
        message: '학생을 찾을 수 없습니다.'
      }));
    }

    const student = students[0];

    // 출석 기록 추가/업데이트
    await query(`
      INSERT INTO attendance_logs (student_id, status, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      updated_at = NOW()
    `, [id, state]);

    // 업데이트된 학생 정보 조회
    const updatedStudents = await query(`
      SELECT 
        s.id,
        s.attendance_number as identifier,
        s.name,
        s.parent_phone as mobile,
        1 as epiVersion,
        COALESCE(a.status, 0) as state,
        COALESCE(a.status, 0) as currentState
      FROM students s
      LEFT JOIN attendance_logs a ON s.id = a.student_id 
        AND DATE(a.created_at) = CURDATE()
      WHERE s.id = ?
    `, [id]);

    const updatedStudent = updatedStudents[0];

    // 기존 앱 호환 형식으로 변환
    const legacyStudent = {
      id: updatedStudent.id.toString(),
      identifier: updatedStudent.identifier,
      name: updatedStudent.name,
      mobile: updatedStudent.mobile,
      epiVersion: updatedStudent.epiVersion,
      state: updatedStudent.state,
      currentState: updatedStudent.currentState,
      validStates: [0, 1, 2, 3, 4]
    };

    res.json(formatLegacyResponse(true, legacyStudent));

    console.log(`✅ 레거시 출석 상태 설정: ${student.name} (ID: ${id}, 상태: ${state})`);

  } catch (error) {
    console.error('Legacy set student state error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '출석 상태 설정 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/student/image/set
 * @desc    기존 앱 호환 학생 이미지 설정 API
 * @access  Private
 */
router.post('/student/image/set', authenticateToken, async (req, res) => {
  try {
    // Multipart 데이터 처리는 추후 구현
    // 현재는 기본 응답 반환
    res.json(formatLegacyResponse(true, {
      id: req.body.id || "1",
      identifier: "STU000001",
      name: "학생",
      mobile: "010-1234-5678",
      epiVersion: 1,
      state: 0,
      currentState: 0,
      validStates: [0, 1, 2, 3, 4]
    }));

  } catch (error) {
    console.error('Legacy set student image error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '학생 이미지 설정 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   POST /api/d/1.0/student/state/thumbnail/set
 * @desc    기존 앱 호환 상태 이미지 설정 API
 * @access  Private
 */
router.post('/student/state/thumbnail/set', authenticateToken, async (req, res) => {
  try {
    // Multipart 데이터 처리는 추후 구현
    // 현재는 기본 응답 반환
    res.json(formatLegacyResponse(true, {
      id: req.body.id || "1",
      identifier: "STU000001",
      name: "학생",
      mobile: "010-1234-5678",
      epiVersion: 1,
      state: 0,
      currentState: 0,
      validStates: [0, 1, 2, 3, 4]
    }));

  } catch (error) {
    console.error('Legacy set state thumbnail error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '상태 이미지 설정 중 오류가 발생했습니다.'
    }));
  }
});

/**
 * @route   GET /api/d/1.0/test
 * @desc    Flutter 앱 연동 테스트 API
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    const testData = {
      message: 'LMS Legacy API 테스트 성공!',
      timestamp: new Date().toISOString(),
      server: {
        name: '학원관리 LMS 백엔드',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      endpoints: {
        login: '/api/d/1.0/login',
        students: '/api/d/1.0/student/get/all',
        attendance: '/api/d/1.0/student/state/set'
      }
    };

    res.json(formatLegacyResponse(true, testData));

    console.log('✅ Legacy API 테스트 요청 처리됨');

  } catch (error) {
    console.error('Legacy test API error:', error);
    res.status(500).json(formatLegacyResponse(false, null, {
      code: 'INTERNAL_SERVER_ERROR',
      message: '테스트 API 처리 중 오류가 발생했습니다.'
    }));
  }
});

module.exports = router;
