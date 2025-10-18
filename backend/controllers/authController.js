const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
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

module.exports = {
  login,
  refreshToken,
  getCurrentUser
};
