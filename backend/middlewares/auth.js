const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT 토큰 생성
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    tenant_id: user.tenant_id  // ✅ tenant_id 추가
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: '인증 토큰이 필요합니다.'
        }
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 조회 (활성 상태 확인) - tenant_id 포함
    const users = await query(
      'SELECT id, username, name, email, role, is_active, tenant_id FROM users WHERE id = ? AND is_active = true',
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

    // 요청 객체에 사용자 정보 추가 (tenant_id 포함)
    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
        }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: '유효하지 않은 토큰입니다.'
        }
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다.'
      }
    });
  }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: '인증이 필요합니다.'
      }
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '관리자 권한이 필요합니다.'
      }
    });
  }

  next();
};

// 슈퍼관리자 권한 확인 미들웨어
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: '인증이 필요합니다.'
      }
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '슈퍼관리자 권한이 필요합니다.'
      }
    });
  }

  next();
};

// 역할 기반 권한 확인 미들웨어
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: '인증이 필요합니다.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '접근 권한이 없습니다.'
        }
      });
    }

    next();
  };
};

// Refresh Token 검증
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateTokens,
  authenticateToken,
  authorizeRole,
  requireAdmin,
  requireSuperAdmin,
  verifyRefreshToken
};