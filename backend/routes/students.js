const express = require('express');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
} = require('../controllers/studentController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { validateStudent, validatePagination, validateId } = require('../middlewares/validation');

const router = express.Router();

// 모든 학생 관련 라우트는 인증 필요
router.use(authenticateToken);

/**
 * @route   GET /api/students
 * @desc    학생 목록 조회 (페이지네이션, 검색 포함)
 * @access  Private (관리자)
 * @query   page, limit, search, classId
 */
router.get('/', validatePagination, getStudents);

/**
 * @route   GET /api/students/:id
 * @desc    학생 상세 조회
 * @access  Private (관리자)
 * @params  id (학생 ID)
 */
router.get('/:id', validateId, getStudentById);

/**
 * @route   POST /api/students
 * @desc    학생 추가
 * @access  Private (관리자)
 * @body    학생 정보
 */
router.post('/', validateStudent, createStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    학생 정보 수정
 * @access  Private (관리자)
 * @params  id (학생 ID)
 * @body    수정할 학생 정보
 */
router.put('/:id', validateId, validateStudent, updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    학생 삭제 (소프트 삭제)
 * @access  Private (관리자)
 * @params  id (학생 ID)
 */
router.delete('/:id', validateId, deleteStudent);

/**
 * @route   POST /api/students/bulk-import
 * @desc    학생 일괄 등록 (엑셀 파일)
 * @access  Private (관리자)
 * @body    multipart/form-data with file
 */
router.post('/bulk-import', bulkImportStudents);

module.exports = router;