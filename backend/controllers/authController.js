const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../middlewares/auth');

// 로그인
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 입력값 검증
    if (!username || !password) {
      return res.status(400).json({
        Success: false,
        Error: '사용자명과 비밀번호를 입력해주세요.',
        Message: 'VALIDATION_ERROR'
      });
    }

    // 사용자 조회
    const users = await query(
      'SELECT id, username, password_hash, name, email, role, is_active, tenant_id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        Success: false,
        Error: '잘못된 사용자명 또는 비밀번호입니다.',
        Message: 'INVALID_CREDENTIALS'
      });
    }

    const user = users[0];

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return res.status(401).json({
        Success: false,
        Error: '비활성화된 계정입니다. 관리자에게 문의하세요.',
        Message: 'ACCOUNT_DISABLED'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        Success: false,
        Error: '잘못된 사용자명 또는 비밀번호입니다.',
        Message: 'INVALID_CREDENTIALS'
      });
    }

    // JWT 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user);

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 프론트엔드와 앱 모두 지원하는 형식으로 응답
    res.json({
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      },
      // 기존 앱 호환성을 위한 필드 (PascalCase)
      Success: true,
      Data: {
        AccessToken: accessToken,
        RefreshToken: refreshToken,
        UserInfo: {
          Id: user.id,
          Username: user.username,
          Name: user.name,
          Email: user.email,
          Role: user.role
        }
      }
    });

    console.log(`✅ 로그인 성공: ${user.username} (${user.name})`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      Success: false,
      Error: '로그인 처리 중 오류가 발생했습니다.',
      Message: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// 토큰 갱신
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.body;

    if (!clientRefreshToken) {
      return res.status(400).json({
        Success: false,
        Error: 'Refresh Token이 필요합니다.',
        Message: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Refresh Token 검증
    let decoded;
    try {
      decoded = verifyRefreshToken(clientRefreshToken);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          Success: false,
          Error: 'Refresh Token이 만료되었습니다. 다시 로그인해주세요.',
          Message: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        Success: false,
        Error: '유효하지 않은 Refresh Token입니다.',
        Message: 'REFRESH_TOKEN_INVALID'
      });
    }

    // 사용자 정보 재조회
    const users = await query(
      'SELECT id, username, name, email, role, is_active, tenant_id FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        Success: false,
        Error: '유효하지 않은 사용자입니다.',
        Message: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];

    // 새로운 토큰 생성
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      accessToken: accessToken,
      refreshToken: newRefreshToken,
      // 기존 앱 호환성
      Success: true,
      Data: {
        AccessToken: accessToken,
        RefreshToken: newRefreshToken
      }
    });

    console.log(`✅ 토큰 갱신 성공: ${user.username}`);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      Success: false,
      Error: '토큰 갱신 처리 중 오류가 발생했습니다.',
      Message: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// 현재 사용자 정보 조회 (앱 형식에 맞춤)
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    // 최신 사용자 정보 재조회
    const users = await query(
      'SELECT id, username, name, email, role, is_active, tenant_id FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        Success: false,
        Error: '사용자를 찾을 수 없습니다.',
        Message: 'USER_NOT_FOUND'
      });
    }

    const userInfo = users[0];

    // 계정 활성화 상태 확인
    if (!userInfo.is_active) {
      return res.status(401).json({
        Success: false,
        Error: '비활성화된 계정입니다. 탈퇴했거나 정지된 계정입니다.',
        Message: 'ACCOUNT_DISABLED',
        success: false,
        error: '비활성화된 계정입니다.'
      });
    }

    // 라이선스 정보 조회 (remaining_days는 SQL에서 계산)
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

    // 프론트엔드와 앱 모두 지원하는 형식으로 응답
    const response = {
      success: true,
      user: {
        id: userInfo.id,
        username: userInfo.username,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role
      },
      // 기존 앱 호환성을 위한 필드 (PascalCase)
      Success: true,
      Header: {
        AppVersion: "1.0.0",
        Licenses: {
          Attend: attendLicense ? {
            RemainingDays: attendLicense.remaining_days,
            LicenseTo: attendLicense.end_date.toISOString().split('T')[0],
            License: attendLicense.license_key
          } : {
            RemainingDays: 0,
            LicenseTo: null,
            License: null
          }
        }
      },
      Data: {
        UserInfo: {
          Id: userInfo.id,
          Name: userInfo.name,
          Username: userInfo.username,
          Email: userInfo.email,
          Role: userInfo.role
        }
      }
    };

    console.log(`✅ 사용자 정보 조회: ${userInfo.username}, 라이선스 잔여일: ${attendLicense ? attendLicense.remaining_days : 0}일`);

    res.json(response);

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      Success: false,
      Error: '사용자 정보 조회 중 오류가 발생했습니다.',
      Message: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// 학원 회원가입
const registerAcademy = async (req, res) => {
  try {
    const {
      academyName,
      academyCode,
      businessNumber,
      ownerName,
      phone,
      email,
      address,
      adminUsername,
      adminPassword,
      adminName
    } = req.body;

    // ✅ 입력값 검증
    if (!academyName || !academyCode || !adminUsername || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '필수 항목을 모두 입력해주세요. (학원명, 학원코드, 관리자ID, 비밀번호)'
        }
      });
    }

    // ✅ 학원코드 형식 검증 (영문, 숫자, 언더스코어만 허용)
    if (!/^[a-zA-Z0-9_]+$/.test(academyCode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACADEMY_CODE',
          message: '학원코드는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.'
        }
      });
    }

    // ✅ 관리자 아이디 형식 검증
    if (!/^[a-zA-Z0-9_]+$/.test(adminUsername)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: '관리자 아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.'
        }
      });
    }

    // ✅ 비밀번호 강도 검증 (최소 6자)
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: '비밀번호는 최소 6자 이상이어야 합니다.'
        }
      });
    }

    // 트랜잭션으로 원자적 처리
    const result = await transaction(async (conn) => {
      // ✅ 1. 학원코드 중복 확인
      const [existingAcademy] = await conn.execute(
        'SELECT id FROM tenants WHERE code = ?',
        [academyCode]
      );

      if (existingAcademy.length > 0) {
        throw new Error('DUPLICATE_ACADEMY_CODE:이미 사용 중인 학원코드입니다.');
      }

      // ✅ 2. 사업자번호 중복 확인 (있을 경우)
      if (businessNumber) {
        const [existingBusiness] = await conn.execute(
          'SELECT id FROM tenants WHERE business_number = ?',
          [businessNumber]
        );

        if (existingBusiness.length > 0) {
          throw new Error('DUPLICATE_BUSINESS_NUMBER:이미 등록된 사업자번호입니다.');
        }
      }

      // ✅ 3. 관리자 아이디 중복 확인
      const [existingUser] = await conn.execute(
        'SELECT id FROM users WHERE username = ?',
        [adminUsername]
      );

      if (existingUser.length > 0) {
        throw new Error('DUPLICATE_USERNAME:이미 사용 중인 아이디입니다.');
      }

      // ✅ 4. 이메일 중복 확인 (있을 경우)
      if (email) {
        const [existingEmail] = await conn.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );

        if (existingEmail.length > 0) {
          throw new Error('DUPLICATE_EMAIL:이미 사용 중인 이메일입니다.');
        }
      }

      // ✅ 5. tenants 테이블에 학원 등록
      const [tenantResult] = await conn.execute(
        `INSERT INTO tenants (
          name, code, business_number, owner_name,
          phone, email, address, status, subscription_plan,
          subscription_start_date, subscription_end_date,
          max_students, max_instructors, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'basic', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1000, 50, NOW())`,
        [academyName, academyCode, businessNumber || null, ownerName || null,
         phone || null, email || null, address || null]
      );

      const tenantId = tenantResult.insertId;

      // ✅ 6. 비밀번호 해싱
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // ✅ 7. users 테이블에 관리자 계정 생성
      const [userResult] = await conn.execute(
        `INSERT INTO users (
          username, password_hash, name, email, role,
          tenant_id, is_active, created_at
        ) VALUES (?, ?, ?, ?, 'admin', ?, TRUE, NOW())`,
        [adminUsername, passwordHash, adminName || ownerName || academyName + ' 관리자',
         email || null, tenantId]
      );

      const userId = userResult.insertId;

      console.log(`✅ 학원 등록 완료: ${academyName} (tenant_id: ${tenantId})`);
      console.log(`✅ 관리자 계정 생성: ${adminUsername} (user_id: ${userId})`);

      return {
        tenantId,
        userId,
        username: adminUsername,
        name: adminName || ownerName || academyName + ' 관리자',
        email: email || null,
        role: 'admin'
      };
    });

    // ✅ 8. JWT 토큰 생성
    const user = {
      id: result.userId,
      username: result.username,
      name: result.name,
      email: result.email,
      role: result.role,
      tenant_id: result.tenantId
    };

    const { accessToken, refreshToken } = generateTokens(user);

    // ✅ 9. 성공 응답
    res.status(201).json({
      success: true,
      message: '학원 등록이 완료되었습니다. 30일 무료 체험이 제공됩니다.',
      data: {
        academy: {
          tenantId: result.tenantId,
          name: academyName,
          code: academyCode
        },
        user: {
          id: result.userId,
          username: result.username,
          name: result.name,
          email: result.email,
          role: result.role
        },
        accessToken,
        refreshToken,
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Register academy error:', error);

    // 커스텀 에러 처리
    if (error.message.startsWith('DUPLICATE_ACADEMY_CODE:')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ACADEMY_CODE',
          message: error.message.split(':')[1]
        }
      });
    }

    if (error.message.startsWith('DUPLICATE_BUSINESS_NUMBER:')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_BUSINESS_NUMBER',
          message: error.message.split(':')[1]
        }
      });
    }

    if (error.message.startsWith('DUPLICATE_USERNAME:')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USERNAME',
          message: error.message.split(':')[1]
        }
      });
    }

    if (error.message.startsWith('DUPLICATE_EMAIL:')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: error.message.split(':')[1]
        }
      });
    }

    // 일반 에러
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학원 등록 중 오류가 발생했습니다.'
      }
    });
  }
};

// 비밀번호 변경
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id
    const tenantId = req.user.tenant_id
    const { currentPassword, newPassword } = req.body

    // 입력값 검증
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
      })
    }

    // 비밀번호 강도 검증 (최소 8자)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 8자 이상이어야 합니다.'
      })
    }

    // 현재 사용자 정보 조회
    const users = await query(
      'SELECT id, password_hash FROM users WHERE id = ? AND tenant_id = ?',
      [userId, tenantId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      })
    }

    const user = users[0]

    // 현재 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      })
    }

    // 새 비밀번호 해싱
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // 비밀번호 업데이트
    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [newPasswordHash, userId, tenantId]
    )

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })

    console.log(`✅ 비밀번호 변경 완료: user_id=${userId}, tenant_id=${tenantId}`)

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    })
  }
}

module.exports = {
  login,
  refreshToken,
  getCurrentUser,
  registerAcademy,
  changePassword
};
