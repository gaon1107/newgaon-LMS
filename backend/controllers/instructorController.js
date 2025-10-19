const InstructorModel = require('../models/instructorModel');

class InstructorController {
  // 강사 목록 조회
  static async getInstructors(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        departmentId = ''
      } = req.query;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      const result = await InstructorModel.getInstructors({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        departmentId,
        tenantId  // ✅ tenant_id 전달
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('InstructorController.getInstructors error:', error);
      res.status(500).json({
        success: false,
        message: '강사 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강사 상세 조회
  static async getInstructorById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기
      const instructor = await InstructorModel.getInstructorById(id, tenantId);

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: '강사를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: instructor
      });
    } catch (error) {
      console.error('InstructorController.getInstructorById error:', error);
      res.status(500).json({
        success: false,
        message: '강사 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강사 추가
  static async createInstructor(req, res) {
    try {
      const instructorData = req.body;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      // 필수 필드 검증
      if (!instructorData.name) {
        return res.status(400).json({
          success: false,
          message: '강사 이름은 필수입니다.'
        });
      }

      const newInstructor = await InstructorModel.createInstructor(instructorData, tenantId);

      res.status(201).json({
        success: true,
        message: '강사가 성공적으로 추가되었습니다.',
        data: newInstructor
      });
    } catch (error) {
      console.error('InstructorController.createInstructor error:', error);

      // 중복 데이터 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 강사 정보입니다.'
        });
      }

      res.status(500).json({
        success: false,
        message: '강사 추가 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강사 정보 수정
  static async updateInstructor(req, res) {
    try {
      const { id } = req.params;
      const instructorData = req.body;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      // 강사 존재 확인 (같은 학원 내에서)
      const exists = await InstructorModel.exists(id, tenantId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: '강사를 찾을 수 없습니다.'
        });
      }

      // 필수 필드 검증
      if (!instructorData.name) {
        return res.status(400).json({
          success: false,
          message: '강사 이름은 필수입니다.'
        });
      }

      const updatedInstructor = await InstructorModel.updateInstructor(id, instructorData, tenantId);

      res.json({
        success: true,
        message: '강사 정보가 성공적으로 수정되었습니다.',
        data: updatedInstructor
      });
    } catch (error) {
      console.error('InstructorController.updateInstructor error:', error);

      // 중복 데이터 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 강사 정보입니다.'
        });
      }

      res.status(500).json({
        success: false,
        message: '강사 정보 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강사 삭제
  static async deleteInstructor(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      // 강사 존재 확인 (같은 학원 내에서)
      const exists = await InstructorModel.exists(id, tenantId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: '강사를 찾을 수 없습니다.'
        });
      }

      await InstructorModel.deleteInstructor(id, tenantId);

      res.json({
        success: true,
        message: '강사가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('InstructorController.deleteInstructor error:', error);
      res.status(500).json({
        success: false,
        message: '강사 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 특정 강의의 강사 조회
  static async getInstructorByLectureId(req, res) {
    try {
      const { lectureId } = req.params;
      const instructor = await InstructorModel.getInstructorByLectureId(lectureId);

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: '해당 강의에 배정된 강사가 없습니다.'
        });
      }

      res.json({
        success: true,
        data: instructor
      });
    } catch (error) {
      console.error('InstructorController.getInstructorByLectureId error:', error);
      res.status(500).json({
        success: false,
        message: '강사 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 담당 강의 없는 강사 목록 조회
  static async getAvailableInstructors(req, res) {
    try {
      const instructors = await InstructorModel.getAvailableInstructors();

      res.json({
        success: true,
        data: instructors
      });
    } catch (error) {
      console.error('InstructorController.getAvailableInstructors error:', error);
      res.status(500).json({
        success: false,
        message: '사용 가능한 강사 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강사 배치 (강의에 강사 배정)
  static async assignInstructorToLecture(req, res) {
    try {
      const { instructorId, lectureId } = req.body;

      if (!instructorId || !lectureId) {
        return res.status(400).json({
          success: false,
          message: '강사 ID와 강의 ID는 필수입니다.'
        });
      }

      // 강사 존재 확인
      const instructorExists = await InstructorModel.exists(instructorId);
      if (!instructorExists) {
        return res.status(404).json({
          success: false,
          message: '강사를 찾을 수 없습니다.'
        });
      }

      // 강의에 강사 배정 (강의 모델을 통해 처리)
      const LectureModel = require('../models/lectureModel');
      const lectureExists = await LectureModel.exists(lectureId);
      if (!lectureExists) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      // 기존 강의 정보 조회 후 강사만 업데이트
      const lecture = await LectureModel.getLectureById(lectureId);
      const updatedLecture = await LectureModel.updateLecture(lectureId, {
        ...lecture,
        instructorId
      });

      res.json({
        success: true,
        message: '강사가 성공적으로 배정되었습니다.',
        data: updatedLecture
      });
    } catch (error) {
      console.error('InstructorController.assignInstructorToLecture error:', error);
      res.status(500).json({
        success: false,
        message: '강사 배정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = InstructorController;