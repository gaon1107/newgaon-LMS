const express = require('express');
const router = express.Router();
const LectureController = require('../controllers/lectureController');
const { authenticateToken } = require('../middlewares/auth');

// 모든 강의 관련 API는 인증 필요
router.use(authenticateToken);

// 강의 목록 조회
router.get('/', LectureController.getLectures);

// 강의 통계 조회
router.get('/stats', LectureController.getLectureStats);

// 강사별 강의 목록 조회
router.get('/instructor/:instructorId', LectureController.getLecturesByInstructorId);

// 학생별 강의 목록 조회
router.get('/student/:studentId', LectureController.getLecturesByStudentId);

// 강의 상세 조회
router.get('/:id', LectureController.getLectureById);

// 강의 추가
router.post('/', LectureController.createLecture);

// 강의 정보 수정
router.put('/:id', LectureController.updateLecture);

// 강의 삭제
router.delete('/:id', LectureController.deleteLecture);

// 학생을 강의에 등록
router.post('/enroll', LectureController.enrollStudentToLecture);

// 학생을 강의에서 제외
router.post('/unenroll', LectureController.unenrollStudentFromLecture);

module.exports = router;