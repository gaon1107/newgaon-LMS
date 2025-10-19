const express = require('express');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/auth');
const { validatePagination, validateId } = require('../middlewares/validation');

const router = express.Router();

// 모든 결제 관련 라우트는 인증 필요
router.use(authenticateToken);

/**
 * @route   GET /api/payments
 * @desc    결제 목록 조회 (페이지네이션, 검색 포함)
 * @access  Private (인증된 사용자)
 * @query   page, limit, search, startDate, endDate
 */
router.get('/', validatePagination, getPayments);

/**
 * @route   GET /api/payments/stats
 * @desc    결제 통계 조회
 * @access  Private (인증된 사용자)
 * @query   startDate, endDate
 */
router.get('/stats', getPaymentStats);

/**
 * @route   GET /api/payments/:id
 * @desc    결제 상세 조회
 * @access  Private (인증된 사용자)
 * @params  id (결제 ID)
 */
router.get('/:id', validateId, getPaymentById);

/**
 * @route   POST /api/payments
 * @desc    결제 추가
 * @access  Private (인증된 사용자)
 * @body    결제 정보
 */
router.post('/', createPayment);

/**
 * @route   PUT /api/payments/:id
 * @desc    결제 정보 수정
 * @access  Private (인증된 사용자)
 * @params  id (결제 ID)
 * @body    수정할 결제 정보
 */
router.put('/:id', validateId, updatePayment);

/**
 * @route   DELETE /api/payments/:id
 * @desc    결제 삭제 (소프트 삭제)
 * @access  Private (인증된 사용자)
 * @params  id (결제 ID)
 */
router.delete('/:id', validateId, deletePayment);

module.exports = router;
