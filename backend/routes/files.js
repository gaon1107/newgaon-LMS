const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { query, param, validationResult } = require('express-validator');
const { db } = require('../config/database');
const xlsx = require('xlsx');

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../uploads');

// 업로드 디렉토리 생성
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Multer 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 허용된 파일 타입
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// 파일 업로드
router.post('/upload', [
  authenticateToken,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '업로드할 파일을 선택해주세요'
        }
      });
    }

    const { type = 'general' } = req.body;
    const uploaderId = req.user.id;

    // 파일 정보 데이터베이스에 저장
    const [result] = await db.execute(`
      INSERT INTO files (
        original_name, filename, file_path, file_size, mime_type,
        file_type, uploader_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.file.originalname,
      req.file.filename,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      type,
      uploaderId
    ]);

    res.json({
      success: true,
      data: {
        fileId: result.insertId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType: type,
        url: `/uploads/${req.file.filename}`
      },
      message: '파일이 성공적으로 업로드되었습니다'
    });

  } catch (error) {
    console.error('파일 업로드 오류:', error);

    // 업로드된 파일 삭제 (DB 저장 실패 시)
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('파일 삭제 실패:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: '파일 업로드 중 오류가 발생했습니다'
      }
    });
  }
});

// 파일 목록 조회
router.get('/', [
  authenticateToken,
  query('type').optional().isIn(['general', 'student', 'report', 'template']).withMessage('유효한 파일 타입을 선택해주세요'),
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit은 1-100 사이여야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let fileQuery = `
      SELECT
        f.id,
        f.original_name,
        f.filename,
        f.file_size,
        f.mime_type,
        f.file_type,
        f.created_at,
        u.name as uploader_name
      FROM files f
      JOIN users u ON f.uploader_id = u.id
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM files f
      WHERE 1=1
    `;

    const queryParams = [];

    if (type) {
      fileQuery += ' AND f.file_type = ?';
      countQuery += ' AND f.file_type = ?';
      queryParams.push(type);
    }

    fileQuery += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';

    const [fileResult] = await db.execute(fileQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await db.execute(countQuery, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        files: fileResult.map(file => ({
          ...file,
          url: `/uploads/${file.filename}`,
          fileSize: formatFileSize(file.file_size)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '파일 목록 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 파일 다운로드
router.get('/:fileId/download', [
  authenticateToken,
  param('fileId').isInt().withMessage('유효한 파일 ID를 입력해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { fileId } = req.params;

    const [fileResult] = await db.execute(`
      SELECT original_name, filename, file_path, mime_type
      FROM files
      WHERE id = ?
    `, [fileId]);

    if (fileResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '파일을 찾을 수 없습니다'
        }
      });
    }

    const file = fileResult[0];
    const filePath = path.resolve(file.file_path);

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_EXISTS',
          message: '파일이 존재하지 않습니다'
        }
      });
    }

    // 다운로드 로그 기록
    await db.execute(`
      INSERT INTO file_downloads (file_id, user_id, downloaded_at)
      VALUES (?, ?, NOW())
    `, [fileId, req.user.id]);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type);

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_ERROR',
        message: '파일 다운로드 중 오류가 발생했습니다'
      }
    });
  }
});

// 파일 삭제
router.delete('/:fileId', [
  authenticateToken,
  param('fileId').isInt().withMessage('유효한 파일 ID를 입력해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { fileId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [fileResult] = await db.execute(`
      SELECT file_path, uploader_id
      FROM files
      WHERE id = ?
    `, [fileId]);

    if (fileResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '파일을 찾을 수 없습니다'
        }
      });
    }

    const file = fileResult[0];

    // 권한 확인 (관리자이거나 업로드한 사용자만 삭제 가능)
    if (userRole !== 'admin' && file.uploader_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSION',
          message: '파일을 삭제할 권한이 없습니다'
        }
      });
    }

    // 데이터베이스에서 파일 정보 삭제
    await db.execute('DELETE FROM files WHERE id = ?', [fileId]);

    // 실제 파일 삭제
    try {
      await fs.unlink(file.file_path);
    } catch (unlinkError) {
      console.error('실제 파일 삭제 실패:', unlinkError);
      // 데이터베이스에서는 삭제되었으므로 성공으로 처리
    }

    res.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다'
    });

  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: '파일 삭제 중 오류가 발생했습니다'
      }
    });
  }
});

// 출결 통계 엑셀 다운로드
router.get('/attendance-report', [
  authenticateToken,
  query('startDate').isDate().withMessage('유효한 시작 날짜를 입력해주세요'),
  query('endDate').isDate().withMessage('유효한 종료 날짜를 입력해주세요'),
  query('classId').optional().isInt().withMessage('유효한 수업 ID를 입력해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { startDate, endDate, classId } = req.query;

    // 출결 데이터 조회
    let attendanceQuery = `
      SELECT
        s.name as student_name,
        s.student_number,
        l.name as lecture_name,
        a.date,
        a.status,
        a.check_in_time,
        a.check_out_time
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN lectures l ON a.lecture_id = l.id
      WHERE a.date BETWEEN ? AND ?
    `;

    const queryParams = [startDate, endDate];

    if (classId) {
      attendanceQuery += ' AND l.id = ?';
      queryParams.push(classId);
    }

    attendanceQuery += ' ORDER BY s.name, a.date';

    const [attendanceData] = await db.execute(attendanceQuery, queryParams);

    // 엑셀 워크북 생성
    const workbook = xlsx.utils.book_new();

    // 출결 데이터 시트 생성
    const attendanceSheet = xlsx.utils.json_to_sheet(
      attendanceData.map(record => ({
        '학생명': record.student_name,
        '학번': record.student_number,
        '강의명': record.lecture_name,
        '날짜': record.date,
        '출결상태': getStatusText(record.status),
        '체크인시간': record.check_in_time || '',
        '체크아웃시간': record.check_out_time || ''
      }))
    );

    xlsx.utils.book_append_sheet(workbook, attendanceSheet, '출결현황');

    // 통계 데이터 조회 및 시트 생성
    let statsQuery = `
      SELECT
        s.name as student_name,
        s.student_number,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100,
          2
        ) as attendance_rate
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
        AND a.date BETWEEN ? AND ?
    `;

    if (classId) {
      statsQuery += ' LEFT JOIN lectures l ON a.lecture_id = l.id WHERE l.id = ?';
    }

    statsQuery += ' GROUP BY s.id, s.name, s.student_number ORDER BY s.name';

    const [statsData] = await db.execute(statsQuery, queryParams);

    const statsSheet = xlsx.utils.json_to_sheet(
      statsData.map(record => ({
        '학생명': record.student_name,
        '학번': record.student_number,
        '총일수': record.total_days,
        '출석': record.present_days,
        '결석': record.absent_days,
        '지각': record.late_days,
        '조퇴': record.early_leave_days,
        '출석률(%)': record.attendance_rate
      }))
    );

    xlsx.utils.book_append_sheet(workbook, statsSheet, '출석통계');

    // 엑셀 파일 버퍼 생성
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 파일명 생성
    const filename = `출결보고서_${startDate}_${endDate}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);

  } catch (error) {
    console.error('출결 보고서 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: '출결 보고서 생성 중 오류가 발생했습니다'
      }
    });
  }
});

// 학생 등록 템플릿 다운로드
router.get('/student-template', [
  authenticateToken
], async (req, res) => {
  try {
    // 템플릿 데이터 생성
    const templateData = [
      {
        '학생명': '홍길동',
        '학번': 'ST2024001',
        '생년월일': '2000-01-01',
        '성별': '남',
        '전화번호': '010-1234-5678',
        '이메일': 'student@example.com',
        '주소': '서울시 강남구',
        '학년': '1',
        '반': 'A',
        '등록일': '2024-03-01',
        '비고': ''
      },
      {
        '학생명': '김영희',
        '학번': 'ST2024002',
        '생년월일': '2000-02-01',
        '성별': '여',
        '전화번호': '010-5678-9012',
        '이메일': 'student2@example.com',
        '주소': '서울시 서초구',
        '학년': '1',
        '반': 'A',
        '등록일': '2024-03-01',
        '비고': ''
      }
    ];

    // 엑셀 워크북 생성
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 10 }, // 학생명
      { wch: 12 }, // 학번
      { wch: 12 }, // 생년월일
      { wch: 6 },  // 성별
      { wch: 15 }, // 전화번호
      { wch: 20 }, // 이메일
      { wch: 20 }, // 주소
      { wch: 6 },  // 학년
      { wch: 6 },  // 반
      { wch: 12 }, // 등록일
      { wch: 15 }  // 비고
    ];

    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, '학생정보');

    // 엑셀 파일 버퍼 생성
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = '학생등록템플릿.xlsx';

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);

  } catch (error) {
    console.error('학생 템플릿 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TEMPLATE_GENERATION_ERROR',
        message: '템플릿 생성 중 오류가 발생했습니다'
      }
    });
  }
});

// 헬퍼 함수들
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusText(status) {
  const statusMap = {
    present: '출석',
    absent: '결석',
    late: '지각',
    early_leave: '조퇴'
  };

  return statusMap[status] || status;
}

// 에러 핸들러
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '파일 크기는 10MB 이하여야 합니다'
        }
      });
    }
  }

  if (error.message === '허용되지 않는 파일 형식입니다') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: '허용되지 않는 파일 형식입니다'
      }
    });
  }

  next(error);
});

module.exports = router;