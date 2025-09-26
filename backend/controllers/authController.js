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
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '사용자명과 비밀번호를 입력해주세요.',
          fields: {
            ...((!username) && { username: ['사용자명은 필수 입력 항목입니다.'] }),
            ...((!password) && { password: ['비밀번호는 필수 입력 항목입니다.'] })
          }
        }
      });
    }

    // 사용자 조회
    const users = await query(
      'SELECT id, username, password_hash, name, email, role, is_active FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '잘못된 사용자명 또는 비밀번호입니다.'
        }
      });
    }

    const user = users[0];

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        }
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '잘못된 사용자명 또는 비밀번호입니다.'
        }
      });
    }

    // JWT 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user);

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 응답 (비밀번호 해시 제외)
    const { password_hash, ...userInfo } = user;

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: userInfo
      }
    });

    console.log(`✅ 로그인 성공: ${user.username} (${user.name})`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '로그인 처리 중 오류가 발생했습니다.'
      }
    });
  }
};

// 토큰 갱신
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.body;

    if (!clientRefreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh Token이 필요합니다.'
        }
      });
    }

    // Refresh Token 검증
    let decoded;
    try {
      decoded = verifyRefreshToken(clientRefreshToken);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh Token이 만료되었습니다. 다시 로그인해주세요.'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: '유효하지 않은 Refresh Token입니다.'
        }
      });
    }

    // 사용자 정보 재조회 (활성 상태 확인)
    const users = await query(
      'SELECT id, username, name, email, role, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '유효하지 않은 사용자입니다.'
        }
      });
    }

    const user = users[0];

    // 새로운 토큰 생성
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

    console.log(`✅ 토큰 갱신 성공: ${user.username}`);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '토큰 갱신 처리 중 오류가 발생했습니다.'
      }
    });
  }
};

// 현재 사용자 정보 조회
const getCurrentUser = async (req, res) => {
  try {
    // 미들웨어에서 설정된 사용자 정보 사용
    const user = req.user;

    // 최신 사용자 정보 재조회
    const users = await query(
      'SELECT id, username, name, email, role, is_active, last_login_at, created_at FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        userInfo: users[0]
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '사용자 정보 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

module.exports = {
  login,
  refreshToken,
  getCurrentUser
};