const express = require('express');
const { login, refreshToken, getCurrentUser, registerAcademy } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register-academy
 * @desc    학원 회원가입 (신규 학원 등록 + 관리자 계정 생성)
 * @access  Public
 * @body    academyName, academyCode, adminUsername, adminPassword, businessNumber (선택), ownerName (선택), phone (선택), email (선택), address (선택), adminName (선택)
 */
router.post('/register-academy', registerAcademy);

/**
 * @route   POST /api/auth/login
 * @desc    사용자 로그인
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Access Token 갱신
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/user
 * @desc    현재 로그인한 사용자 정보 조회
 * @access  Private (JWT 토큰 필요)
 */
router.get('/user', authenticateToken, getCurrentUser);

module.exports = router;