const express = require('express');
const {
  getCurrentMonthPayments,
  getStudentPaymentInfo,
  createPayment,
  updatePayment,
  deletePayment
} = require('../controllers/studentPaymentController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// 모든 학생 납부 관련 라우트는 인증 필요
router.use(authenticateToken);

/**
 * @route   GET /api/student-payments/current-month
 * @desc    당월 전체 학생 납부 현황 조회
 * @access  Private (인증된 사용자)
 * @query   yearMonth (YYYY-MM 형식)
 */
router.get('/current-month', getCurrentMonthPayments);

/**
 * @route   GET /api/student-payments/student/:studentId
 * @desc    특정 학생의 납부 내역 + 신청 강의 조회
 * @access  Private (인증된 사용자)
 * @params  studentId
 * @query   startMonth, endMonth (YYYY-MM 형식)
 */
router.get('/student/:studentId', getStudentPaymentInfo);

/**
 * @route   POST /api/student-payments
 * @desc    납부 추가
 * @access  Private (인증된 사용자)
 * @body    납부 정보
 */
router.post('/', createPayment);

/**
 * @route   PUT /api/student-payments/:id
 * @desc    납부 수정
 * @access  Private (인증된 사용자)
 * @params  id (납부 ID)
 * @body    수정할 납부 정보
 */
router.put('/:id', updatePayment);

/**
 * @route   DELETE /api/student-payments/:id
 * @desc    납부 삭제 (소프트 삭제)
 * @access  Private (인증된 사용자)
 * @params  id (납부 ID)
 */
router.delete('/:id', deletePayment);

module.exports = router;
