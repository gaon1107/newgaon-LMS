const { query, transaction } = require('../config/database');

class InstructorModel {
  // 강사 목록 조회 (페이지네이션, 검색 포함)
  static async getInstructors({ page = 1, limit = 20, search = '', departmentId = '' }) {
    try {
      const offset = (page - 1) * limit;
      let whereClauses = ['i.is_active = true'];
      let queryParams = [];

      // 검색 조건
      if (search) {
        whereClauses.push('(i.name LIKE ? OR i.department LIKE ? OR i.subject LIKE ? OR i.phone LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // 학과 필터
      if (departmentId) {
        whereClauses.push('i.department_id = ?');
        queryParams.push(departmentId);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 총 개수 조회
      const countQuery = `
        SELECT COUNT(*) as total
        FROM instructors i
        ${whereClause}
      `;
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      // 강사 목록 조회 (강의 정보 포함)
      const instructorsQuery = `
        SELECT
          i.*,
          GROUP_CONCAT(
            DISTINCT CONCAT(l.id, ':', l.name)
            ORDER BY l.name
            SEPARATOR '|'
          ) as lecture_info
        FROM instructors i
        LEFT JOIN instructor_lectures il ON i.id = il.instructor_id AND il.is_active = true
        LEFT JOIN lectures l ON il.lecture_id = l.id AND l.is_active = true
        ${whereClause}
        GROUP BY i.id
        ORDER BY i.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const instructors = await query(instructorsQuery, queryParams);

      // 강의 정보 파싱
      const processedInstructors = instructors.map(instructor => {
        const lectures = [];

        if (instructor.lecture_info) {
          const lectureInfos = instructor.lecture_info.split('|');
          lectureInfos.forEach(info => {
            const [id, name] = info.split(':');
            lectures.push({ id, name });
          });
        }

        return {
          ...instructor,
          assignedLectures: lectures.map(l => l.id),
          lectures: lectures.map(l => l.name).join(', ') || '미배정',
          lecture_info: undefined // 임시 필드 제거
        };
      });

      return {
        instructors: processedInstructors,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('InstructorModel.getInstructors error:', error);
      throw error;
    }
  }

  // 강사 상세 조회
  static async getInstructorById(id) {
    try {
      const instructorQuery = `
        SELECT
          i.*,
          GROUP_CONCAT(
            DISTINCT CONCAT(l.id, ':', l.name)
            ORDER BY l.name
            SEPARATOR '|'
          ) as lecture_info
        FROM instructors i
        LEFT JOIN instructor_lectures il ON i.id = il.instructor_id AND il.is_active = true
        LEFT JOIN lectures l ON il.lecture_id = l.id AND l.is_active = true
        WHERE i.id = ? AND i.is_active = true
        GROUP BY i.id
      `;

      const instructors = await query(instructorQuery, [id]);
      if (instructors.length === 0) {
        return null;
      }

      const instructor = instructors[0];
      const lectures = [];

      if (instructor.lecture_info) {
        const lectureInfos = instructor.lecture_info.split('|');
        lectureInfos.forEach(info => {
          const [lectureId, name] = info.split(':');
          lectures.push({ id: lectureId, name });
        });
      }

      return {
        ...instructor,
        assignedLectures: lectures.map(l => l.id),
        lectures: lectures.map(l => l.name).join(', ') || '미배정',
        lecture_info: undefined // 임시 필드 제거
      };
    } catch (error) {
      console.error('InstructorModel.getInstructorById error:', error);
      throw error;
    }
  }

  // 강사 추가
  static async createInstructor(instructorData) {
    try {
      const result = await transaction(async (conn) => {
        const {
          assignedLectures = [],
          ...basicData
        } = instructorData;

        // 강사 기본 정보 삽입
        const insertQuery = `
          INSERT INTO instructors (
            name, department, subject, phone, email, hire_date,
            address, notes, salary, employment_type, status,
            profile_image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
          basicData.name,
          basicData.department || null,
          basicData.subject || null,
          basicData.phone || null,
          basicData.email || null,
          basicData.hireDate || null,
          basicData.address || null,
          basicData.notes || null,
          basicData.salary || 0,
          basicData.employmentType || 'full-time',
          basicData.status || 'active',
          basicData.profileImage || null
        ];

        const [insertResult] = await conn.execute(insertQuery, insertParams);
        const instructorId = insertResult.insertId;

        // 강의 연결
        if (assignedLectures.length > 0) {
          for (const lectureId of assignedLectures) {
            await conn.execute(
              'INSERT INTO instructor_lectures (instructor_id, lecture_id) VALUES (?, ?)',
              [instructorId, lectureId]
            );
          }

          // 강의별 담당 강사 업데이트
          for (const lectureId of assignedLectures) {
            await conn.execute(`
              UPDATE lectures
              SET instructor_id = ?
              WHERE id = ?
            `, [instructorId, lectureId]);
          }
        }

        return instructorId;
      });

      // 생성된 강사 정보 반환
      return await this.getInstructorById(result);
    } catch (error) {
      console.error('InstructorModel.createInstructor error:', error);
      throw error;
    }
  }

  // 강사 정보 수정
  static async updateInstructor(id, instructorData) {
    try {
      const result = await transaction(async (conn) => {
        const {
          assignedLectures = [],
          ...basicData
        } = instructorData;

        // 강사 기본 정보 업데이트
        const updateQuery = `
          UPDATE instructors SET
            name = ?, department = ?, subject = ?, phone = ?,
            email = ?, hire_date = ?, address = ?, notes = ?,
            salary = ?, employment_type = ?, status = ?,
            profile_image_url = ?, updated_at = NOW()
          WHERE id = ? AND is_active = true
        `;

        const updateParams = [
          basicData.name,
          basicData.department || null,
          basicData.subject || null,
          basicData.phone || null,
          basicData.email || null,
          basicData.hireDate || null,
          basicData.address || null,
          basicData.notes || null,
          basicData.salary || 0,
          basicData.employmentType || 'full-time',
          basicData.status || 'active',
          basicData.profileImage || null,
          id
        ];

        await conn.execute(updateQuery, updateParams);

        // 기존 강의 연결 비활성화
        await conn.execute(
          'UPDATE instructor_lectures SET is_active = false WHERE instructor_id = ?',
          [id]
        );

        // 기존 강의들의 강사 정보 초기화
        await conn.execute(
          'UPDATE lectures SET instructor_id = NULL WHERE instructor_id = ?',
          [id]
        );

        // 새로운 강의 연결
        if (assignedLectures.length > 0) {
          for (const lectureId of assignedLectures) {
            // 기존 연결이 있으면 활성화, 없으면 새로 생성
            const [existing] = await conn.execute(
              'SELECT id FROM instructor_lectures WHERE instructor_id = ? AND lecture_id = ?',
              [id, lectureId]
            );

            if (existing.length > 0) {
              await conn.execute(
                'UPDATE instructor_lectures SET is_active = true WHERE instructor_id = ? AND lecture_id = ?',
                [id, lectureId]
              );
            } else {
              await conn.execute(
                'INSERT INTO instructor_lectures (instructor_id, lecture_id) VALUES (?, ?)',
                [id, lectureId]
              );
            }

            // 강의의 담당 강사 업데이트
            await conn.execute(`
              UPDATE lectures SET instructor_id = ? WHERE id = ?
            `, [id, lectureId]);
          }
        }

        return id;
      });

      // 수정된 강사 정보 반환
      return await this.getInstructorById(result);
    } catch (error) {
      console.error('InstructorModel.updateInstructor error:', error);
      throw error;
    }
  }

  // 강사 삭제 (소프트 삭제)
  static async deleteInstructor(id) {
    try {
      await transaction(async (conn) => {
        // 강사를 비활성화
        await conn.execute(
          'UPDATE instructors SET is_active = false WHERE id = ?',
          [id]
        );

        // 강의 연결 비활성화
        await conn.execute(
          'UPDATE instructor_lectures SET is_active = false WHERE instructor_id = ?',
          [id]
        );

        // 관련 강의들의 강사 정보 초기화
        await conn.execute(
          'UPDATE lectures SET instructor_id = NULL WHERE instructor_id = ?',
          [id]
        );
      });

      return true;
    } catch (error) {
      console.error('InstructorModel.deleteInstructor error:', error);
      throw error;
    }
  }

  // 강사 존재 확인
  static async exists(id) {
    try {
      const [result] = await query(
        'SELECT COUNT(*) as count FROM instructors WHERE id = ? AND is_active = true',
        [id]
      );
      return result.count > 0;
    } catch (error) {
      console.error('InstructorModel.exists error:', error);
      throw error;
    }
  }

  // 특정 강의의 강사 조회
  static async getInstructorByLectureId(lectureId) {
    try {
      const instructorQuery = `
        SELECT i.*
        FROM instructors i
        JOIN instructor_lectures il ON i.id = il.instructor_id
        WHERE il.lecture_id = ? AND il.is_active = true AND i.is_active = true
      `;

      const instructors = await query(instructorQuery, [lectureId]);
      return instructors.length > 0 ? instructors[0] : null;
    } catch (error) {
      console.error('InstructorModel.getInstructorByLectureId error:', error);
      throw error;
    }
  }

  // 담당 강의 없는 강사 목록 조회
  static async getAvailableInstructors() {
    try {
      const availableQuery = `
        SELECT i.*
        FROM instructors i
        LEFT JOIN instructor_lectures il ON i.id = il.instructor_id AND il.is_active = true
        WHERE i.is_active = true AND il.instructor_id IS NULL
        ORDER BY i.name
      `;

      return await query(availableQuery);
    } catch (error) {
      console.error('InstructorModel.getAvailableInstructors error:', error);
      throw error;
    }
  }
}

module.exports = InstructorModel;