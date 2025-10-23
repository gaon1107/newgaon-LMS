const LectureModel = require('../models/lectureModel');
const InstructorModel = require('../models/instructorModel');
const StudentModel = require('../models/studentModel');

class LectureController {
  // 강의 목록 조회
  static async getLectures(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        instructorId = '',
        status = ''
      } = req.query;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      const result = await LectureModel.getLectures({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        instructorId,
        status,
        tenantId  // ✅ tenant_id 전달
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('LectureController.getLectures error:', error);
      res.status(500).json({
        success: false,
        message: '강의 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강의 상세 조회
  static async getLectureById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기
      const lecture = await LectureModel.getLectureById(id, tenantId);

      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: lecture
      });
    } catch (error) {
      console.error('LectureController.getLectureById error:', error);
      res.status(500).json({
        success: false,
        message: '강의 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강의 추가
  static async createLecture(req, res) {
    try {
      const lectureData = req.body;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      // 필수 필드 검증
      if (!lectureData.name) {
        return res.status(400).json({
          success: false,
          message: '강의 이름은 필수입니다.'
        });
      }

      // 강사 존재 확인 (강사 ID가 제공된 경우, 같은 학원 내에서)
      if (lectureData.instructorId) {
        const instructorExists = await InstructorModel.exists(lectureData.instructorId, tenantId);
        if (!instructorExists) {
          return res.status(404).json({
            success: false,
            message: '지정된 강사를 찾을 수 없습니다.'
          });
        }
      }

      // 등록할 학생들 존재 확인 (학생 ID가 제공된 경우, 같은 학원 내에서)
      if (lectureData.enrolledStudents && lectureData.enrolledStudents.length > 0) {
        for (const studentId of lectureData.enrolledStudents) {
          const studentExists = await StudentModel.exists(studentId, tenantId);
          if (!studentExists) {
            return res.status(404).json({
              success: false,
              message: `학생 ID ${studentId}를 찾을 수 없습니다.`
            });
          }
        }
      }

      // 최대 학생 수 검증
      if (lectureData.maxStudents && lectureData.enrolledStudents &&
          lectureData.enrolledStudents.length > lectureData.maxStudents) {
        return res.status(400).json({
          success: false,
          message: '등록하려는 학생 수가 최대 수강 인원을 초과합니다.'
        });
      }

      const newLecture = await LectureModel.createLecture(lectureData, tenantId);

      res.status(201).json({
        success: true,
        message: '강의가 성공적으로 추가되었습니다.',
        data: newLecture
      });
    } catch (error) {
      console.error('LectureController.createLecture error:', error);

      // 중복 데이터 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 강의 정보입니다.'
        });
      }

      res.status(500).json({
        success: false,
        message: '강의 추가 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강의 정보 수정
  static async updateLecture(req, res) {
    try {
      const { id } = req.params;
      const lectureData = req.body;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      console.log('🔍 강의 수정 요청:');
      console.log('  - ID:', id);
      console.log('  - tenant_id:', tenantId);
      console.log('  - 받은 데이터:', JSON.stringify(lectureData, null, 2));

      // 강의 존재 확인 (같은 학원 내에서)
      const exists = await LectureModel.exists(id, tenantId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      // 필수 필드 검증
      if (!lectureData.name) {
        return res.status(400).json({
          success: false,
          message: '강의 이름은 필수입니다.'
        });
      }

      // 강사 존재 확인 (강사 ID가 제공된 경우)
      if (lectureData.instructorId) {
        const instructorExists = await InstructorModel.exists(lectureData.instructorId);
        if (!instructorExists) {
          return res.status(404).json({
            success: false,
            message: '지정된 강사를 찾을 수 없습니다.'
          });
        }
      }

      // 등록할 학생들 존재 확인 (학생 ID가 제공된 경우)
      if (lectureData.enrolledStudents && lectureData.enrolledStudents.length > 0) {
        for (const studentId of lectureData.enrolledStudents) {
          const studentExists = await StudentModel.exists(studentId);
          if (!studentExists) {
            return res.status(404).json({
              success: false,
              message: `학생 ID ${studentId}를 찾을 수 없습니다.`
            });
          }
        }
      }

      // 최대 학생 수 검증
      if (lectureData.maxStudents && lectureData.enrolledStudents &&
          lectureData.enrolledStudents.length > lectureData.maxStudents) {
        return res.status(400).json({
          success: false,
          message: '등록하려는 학생 수가 최대 수강 인원을 초과합니다.'
        });
      }

      const updatedLecture = await LectureModel.updateLecture(id, lectureData, tenantId);

      res.json({
        success: true,
        message: '강의 정보가 성공적으로 수정되었습니다.',
        data: updatedLecture
      });
    } catch (error) {
      console.error('LectureController.updateLecture error:', error);

      // 중복 데이터 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 강의 정보입니다.'
        });
      }

      res.status(500).json({
        success: false,
        message: '강의 정보 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강의 삭제
  static async deleteLecture(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

      // 강의 존재 확인 (같은 학원 내에서)
      const exists = await LectureModel.exists(id, tenantId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      await LectureModel.deleteLecture(id, tenantId);

      res.json({
        success: true,
        message: '강의가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('LectureController.deleteLecture error:', error);
      res.status(500).json({
        success: false,
        message: '강의 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 특정 강사의 강의 목록 조회
  static async getLecturesByInstructorId(req, res) {
    try {
      const { instructorId } = req.params;

      // 강사 존재 확인
      const instructorExists = await InstructorModel.exists(instructorId);
      if (!instructorExists) {
        return res.status(404).json({
          success: false,
          message: '강사를 찾을 수 없습니다.'
        });
      }

      const lectures = await LectureModel.getLecturesByInstructorId(instructorId);

      res.json({
        success: true,
        data: lectures
      });
    } catch (error) {
      console.error('LectureController.getLecturesByInstructorId error:', error);
      res.status(500).json({
        success: false,
        message: '강사별 강의 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 특정 학생의 강의 목록 조회
  static async getLecturesByStudentId(req, res) {
    try {
      const { studentId } = req.params;

      // 학생 존재 확인
      const studentExists = await StudentModel.exists(studentId);
      if (!studentExists) {
        return res.status(404).json({
          success: false,
          message: '학생을 찾을 수 없습니다.'
        });
      }

      const lectures = await LectureModel.getLecturesByStudentId(studentId);

      res.json({
        success: true,
        data: lectures
      });
    } catch (error) {
      console.error('LectureController.getLecturesByStudentId error:', error);
      res.status(500).json({
        success: false,
        message: '학생별 강의 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 강의 통계 조회
  static async getLectureStats(req, res) {
    try {
      const stats = await LectureModel.getLectureStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('LectureController.getLectureStats error:', error);
      res.status(500).json({
        success: false,
        message: '강의 통계 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 학생을 강의에 등록
  static async enrollStudentToLecture(req, res) {
    try {
      const { lectureId, studentId } = req.body;

      if (!lectureId || !studentId) {
        return res.status(400).json({
          success: false,
          message: '강의 ID와 학생 ID는 필수입니다.'
        });
      }

      // 강의 존재 확인
      const lectureExists = await LectureModel.exists(lectureId);
      if (!lectureExists) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      // 학생 존재 확인
      const studentExists = await StudentModel.exists(studentId);
      if (!studentExists) {
        return res.status(404).json({
          success: false,
          message: '학생을 찾을 수 없습니다.'
        });
      }

      // 현재 강의 정보 조회
      const lecture = await LectureModel.getLectureById(lectureId);

      // 최대 수강 인원 확인
      if (lecture.max_students && lecture.current_students >= lecture.max_students) {
        return res.status(400).json({
          success: false,
          message: '강의 최대 수강 인원이 초과되었습니다.'
        });
      }

      // 이미 등록된 학생인지 확인
      if (lecture.enrolledStudents.includes(studentId.toString())) {
        return res.status(409).json({
          success: false,
          message: '이미 해당 강의에 등록된 학생입니다.'
        });
      }

      // 학생을 강의에 추가
      const updatedEnrolledStudents = [...lecture.enrolledStudents, studentId.toString()];
      const updatedLecture = await LectureModel.updateLecture(lectureId, {
        ...lecture,
        enrolledStudents: updatedEnrolledStudents
      });

      res.json({
        success: true,
        message: '학생이 성공적으로 강의에 등록되었습니다.',
        data: updatedLecture
      });
    } catch (error) {
      console.error('LectureController.enrollStudentToLecture error:', error);
      res.status(500).json({
        success: false,
        message: '학생 등록 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 학생을 강의에서 제외
  static async unenrollStudentFromLecture(req, res) {
    try {
      const { lectureId, studentId } = req.body;

      if (!lectureId || !studentId) {
        return res.status(400).json({
          success: false,
          message: '강의 ID와 학생 ID는 필수입니다.'
        });
      }

      // 강의 존재 확인
      const lectureExists = await LectureModel.exists(lectureId);
      if (!lectureExists) {
        return res.status(404).json({
          success: false,
          message: '강의를 찾을 수 없습니다.'
        });
      }

      // 현재 강의 정보 조회
      const lecture = await LectureModel.getLectureById(lectureId);

      // 등록된 학생인지 확인
      if (!lecture.enrolledStudents.includes(studentId.toString())) {
        return res.status(404).json({
          success: false,
          message: '해당 강의에 등록되지 않은 학생입니다.'
        });
      }

      // 학생을 강의에서 제외
      const updatedEnrolledStudents = lecture.enrolledStudents.filter(
        id => id !== studentId.toString()
      );
      const updatedLecture = await LectureModel.updateLecture(lectureId, {
        ...lecture,
        enrolledStudents: updatedEnrolledStudents
      });

      res.json({
        success: true,
        message: '학생이 성공적으로 강의에서 제외되었습니다.',
        data: updatedLecture
      });
    } catch (error) {
      console.error('LectureController.unenrollStudentFromLecture error:', error);
      res.status(500).json({
        success: false,
        message: '학생 제외 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = LectureController;