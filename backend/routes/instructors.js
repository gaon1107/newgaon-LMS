const express = require('express');
const router = express.Router();
const InstructorController = require('../controllers/instructorController');
const { authenticateToken } = require('../middlewares/auth');

// 모든 강사 관련 API는 인증 필요
router.use(authenticateToken);

// 강사 목록 조회
router.get('/', InstructorController.getInstructors);

// 담당 강의 없는 강사 목록 조회
router.get('/available', InstructorController.getAvailableInstructors);

// 강의별 강사 조회
router.get('/lecture/:lectureId', InstructorController.getInstructorByLectureId);

// 강사 상세 조회
router.get('/:id', InstructorController.getInstructorById);

// 강사 추가
router.post('/', InstructorController.createInstructor);

// 강사 정보 수정
router.put('/:id', InstructorController.updateInstructor);

// 강사 삭제
router.delete('/:id', InstructorController.deleteInstructor);

// 강사를 강의에 배정
router.post('/assign', InstructorController.assignInstructorToLecture);

module.exports = router;