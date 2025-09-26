const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// 보안 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15분
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }
});
app.use('/api', limiter);

// 기본 미들웨어
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '학원관리 LMS 백엔드 서버가 정상적으로 실행 중입니다.',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health Check
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    success: true,
    status: 'healthy',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 라우터 연결
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/auth')); // /api/user 엔드포인트를 위해
app.use('/api/students', require('./routes/students'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/lectures', require('./routes/lectures'));

// API 라우터 연결 (추가 구현 완료)
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));
app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/announcements', require('./routes/announcements')); // 추후 구현 예정

// 기존 GFKids 앱 호환용 레거시 API 라우터 연결
app.use('/api/d/1.0', require('./routes/legacy_api'));

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: '요청하신 경로를 찾을 수 없습니다.'
    }
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Error:', error);

  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 데이터베이스 연결에 실패했습니다.');
      console.log('💡 .env 파일의 데이터베이스 설정을 확인해주세요.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🚀 학원관리 LMS 백엔드 서버 시작`);
      console.log(`🚀 포트: ${PORT}`);
      console.log(`🚀 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log('🚀 ================================');
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  console.log('🛑 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 서버를 종료합니다...');
  process.exit(0);
});

startServer();

module.exports = app;