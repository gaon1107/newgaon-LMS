const StudentModel = require('../models/studentModel');

// 학생 목록 조회
const getStudents = async (req, res) => {
  try {
    const { page, limit, search, classId } = req.query;

    const result = await StudentModel.getStudents({
      page,
      limit,
      search,
      classId
    });

    res.json({
      success: true,
      data: result
    });

    console.log(`✅ 학생 목록 조회: 페이지 ${page}, ${result.students.length}개 조회`);

  } catch (error) {
    console.error('getStudents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 학생 상세 조회
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await StudentModel.getStudentById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        student
      }
    });

    console.log(`✅ 학생 상세 조회: ${student.name} (ID: ${id})`);

  } catch (error) {
    console.error('getStudentById error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 학생 추가
const createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // 학부모 연락처 중복 확인 (선택사항)
    // const existingStudent = await StudentModel.getByParentPhone(studentData.parentPhone);
    // if (existingStudent) {
    //   return res.status(409).json({
    //     success: false,
    //     error: {
    //       code: 'DUPLICATE_PARENT_PHONE',
    //       message: '이미 등록된 학부모 연락처입니다.'
    //     }
    //   });
    // }

    const student = await StudentModel.createStudent(studentData);

    res.status(201).json({
      success: true,
      data: {
        student
      }
    });

    console.log(`✅ 학생 추가 완료: ${student.name} (ID: ${student.id})`);

  } catch (error) {
    console.error('createStudent error:', error);

    // 중복 키 에러 처리
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: '중복된 데이터가 있습니다.'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 등록 중 오류가 발생했습니다.'
      }
    });
  }
};

// 학생 정보 수정
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = req.body;

    // 학생 존재 확인
    const exists = await StudentModel.exists(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다.'
        }
      });
    }

    const student = await StudentModel.updateStudent(id, studentData);

    res.json({
      success: true,
      data: {
        student
      }
    });

    console.log(`✅ 학생 정보 수정 완료: ${student.name} (ID: ${id})`);

  } catch (error) {
    console.error('updateStudent error:', error);

    // 중복 키 에러 처리
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: '중복된 데이터가 있습니다.'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 정보 수정 중 오류가 발생했습니다.'
      }
    });
  }
};

// 학생 삭제
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // 학생 존재 확인
    const exists = await StudentModel.exists(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다.'
        }
      });
    }

    await StudentModel.deleteStudent(id);

    res.json({
      success: true,
      message: '학생이 성공적으로 삭제되었습니다.'
    });

    console.log(`✅ 학생 삭제 완료: ID ${id}`);

  } catch (error) {
    console.error('deleteStudent error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 삭제 중 오류가 발생했습니다.'
      }
    });
  }
};

// 학생 일괄 등록 (엑셀) - 추후 구현
const bulkImportStudents = async (req, res) => {
  try {
    // TODO: 엑셀 파일 파싱 및 일괄 등록 로직 구현
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '아직 구현되지 않은 기능입니다.'
      }
    });
  } catch (error) {
    console.error('bulkImportStudents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '일괄 등록 중 오류가 발생했습니다.'
      }
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
};