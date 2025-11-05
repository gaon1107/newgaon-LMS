const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  uploadStudentPhoto
} = require('../controllers/studentController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { validateStudent, validatePagination, validateId } = require('../middlewares/validation');

const router = express.Router();

// Multer 설정: tenant별 폴더 분리 및 파일명 생성
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.user?.tenant_id;
    const uploadPath = path.join(__dirname, '../uploads/students', String(tenantId));

    // tenant별 폴더가 없으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const tenantId = req.user?.tenant_id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    // 파일명: {tenantId}_student_{timestamp}.jpg
    const filename = `${tenantId}_student_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// 파일 필터: 이미지 파일만 허용
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)'));
  }
};

// Multer 인스턴스 생성
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// 모든 학생 관련 라우트는 인증 필요
router.use(authenticateToken);

/**
 * @route   POST /api/students/upload-photo
 * @desc    학생 프로필 사진 업로드
 * @access  Private (관리자)
 * @body    multipart/form-data with photo file
 */
router.post('/upload-photo', upload.single('photo'), uploadStudentPhoto);

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