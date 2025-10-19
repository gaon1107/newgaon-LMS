const express = require('express');
const {
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getMyTenant,
  updateMyTenant,
  deleteMyTenant
} = require('../controllers/tenantController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

/**
 * 모든 라우트에 인증 미들웨어 적용
 */
router.use(authenticateToken);

/**
 * @route   GET /api/tenants/me
 * @desc    현재 사용자의 학원 정보 조회
 * @access  Private
 */
router.get('/me', getMyTenant);

/**
 * @route   PUT /api/tenants/me
 * @desc    현재 사용자의 학원 정보 수정
 * @access  Private
 */
router.put('/me', updateMyTenant);

/**
 * @route   DELETE /api/tenants/me
 * @desc    현재 사용자의 학원 탈퇴 (비밀번호 확인 필요)
 * @access  Private
 */
router.delete('/me', deleteMyTenant);

/**
 * @route   GET /api/tenants
 * @desc    모든 학원 목록 조회 (슈퍼관리자 전용)
 * @access  Private (superadmin)
 */
router.get('/', getAllTenants);

/**
 * @route   GET /api/tenants/:id
 * @desc    특정 학원 상세 정보 조회 (슈퍼관리자 전용)
 * @access  Private (superadmin)
 */
router.get('/:id', getTenantById);

/**
 * @route   PUT /api/tenants/:id
 * @desc    학원 정보 수정 (슈퍼관리자 전용)
 * @access  Private (superadmin)
 */
router.put('/:id', updateTenant);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    학원 삭제 (슈퍼관리자 전용)
 * @access  Private (superadmin)
 */
router.delete('/:id', deleteTenant);

module.exports = router;
