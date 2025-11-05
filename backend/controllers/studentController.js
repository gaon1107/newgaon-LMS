const StudentModel = require('../models/studentModel');

// 학생 목록 조회
const getStudents = async (req, res) => {
  try {
    const { page, limit, search, classId } = req.query;
    const tenantId = req.user?.tenant_id; // ✅ 요청자의 tenant_id 가져오기

    const result = await StudentModel.getStudents({
      page,
      limit,
      search,
      classId,
      tenantId // ✅ tenant_id 전달!
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
    const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

    const student = await StudentModel.getStudentById(id, tenantId);

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
    const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

    console.log('🔍 학생 추가 요청 받음:');
    console.log('  - 받은 출결번호:', studentData.attendanceNumber);
    console.log('  - tenant_id:', tenantId);
    console.log('  - 전체 데이터:', JSON.stringify(studentData, null, 2));

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

    const student = await StudentModel.createStudent(studentData, tenantId);

    console.log('🔍 DB에 저장 후 반환된 학생 정보:');
    console.log('  - 이름:', student.name);
    console.log('  - 출결번호:', student.attendanceNumber);

    res.status(201).json({
      success: true,
      data: {
        student
      }
    });

    console.log(`✅ 학생 추가 완료: ${student.name} (ID: ${student.id}) - 출결번호: ${student.attendanceNumber}`);

  } catch (error) {
    console.error('createStudent error:', error);

    // ✅ 이름 중복 에러 처리
    if (error.message && error.message.includes('이미 등록된 학생 이름입니다')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: '이미 등록된 학생 이름입니다.'
        }
      });
    }

    // 출결번호 중복 에러 처리
    if (error.message && error.message.includes('이미 사용 중인 출결번호입니다')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ATTENDANCE_NUMBER',
          message: '이미 사용 중인 출결번호입니다.'
        }
      });
    }

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
    const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

    console.log('🔍 학생 수정 요청 받음:');
    console.log('  - ID:', id);
    console.log('  - tenant_id:', tenantId);
    console.log('  - 받은 출결번호:', studentData.attendanceNumber);
    console.log('  - 전체 데이터:', JSON.stringify(studentData, null, 2));

    // 학생 존재 확인 (같은 학원 내에서)
    const exists = await StudentModel.exists(id, tenantId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다.'
        }
      });
    }

    const student = await StudentModel.updateStudent(id, studentData, tenantId);

    console.log('🔍 DB에서 업데이트 후 반환된 학생 정보:');
    console.log('  - 이름:', student.name);
    console.log('  - 출결번호:', student.attendanceNumber);
    console.log('  - 전체:', JSON.stringify(student, null, 2));

    res.json({
      success: true,
      data: {
        student
      }
    });

    console.log(`✅ 학생 정보 수정 완료: ${student.name} (ID: ${id}) - 출결번호: ${student.attendanceNumber}`);

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
    const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

    // 학생 존재 확인 (같은 학원 내에서)
    const exists = await StudentModel.exists(id, tenantId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: '학생을 찾을 수 없습니다.'
        }
      });
    }

    await StudentModel.deleteStudent(id, tenantId);

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

// 학생 프로필 사진 업로드
const uploadStudentPhoto = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id; // ✅ tenant_id 가져오기

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: '업로드할 파일이 없습니다.'
        }
      });
    }

    // 파일 경로 생성 (프론트엔드에서 사용할 URL 경로)
    // ✅ tenantId 포함 (multer에서 저장한 경로와 일치)
    const photoPath = `/uploads/students/${tenantId}/${req.file.filename}`;

    console.log(`✅ 학생 프로필 사진 업로드 완료: ${photoPath}`);

    res.json({
      success: true,
      data: {
        photoPath
      },
      message: '프로필 사진이 업로드되었습니다.'
    });

  } catch (error) {
    console.error('uploadStudentPhoto error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '프로필 사진 업로드 중 오류가 발생했습니다.'
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
  bulkImportStudents,
  uploadStudentPhoto
};