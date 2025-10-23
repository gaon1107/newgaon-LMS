const { query, transaction } = require('../config/database');

class LectureModel {
  // 강의 목록 조회 (페이지네이션, 검색 포함)
  static async getLectures({ page = 1, limit = 20, search = '', instructorId = '', status = '', tenantId = null }) {
    try {
      const offset = (page - 1) * limit;
      let whereClauses = ['l.is_active = true'];
      let queryParams = [];

      if (tenantId) {
        whereClauses.push('l.tenant_id = ?');
        queryParams.push(tenantId);
      }

      if (search) {
        whereClauses.push('(l.name LIKE ? OR l.subject LIKE ? OR l.description LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (instructorId) {
        whereClauses.push('l.instructor_id = ?');
        queryParams.push(instructorId);
      }

      if (status) {
        whereClauses.push('l.status = ?');
        queryParams.push(status);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countQuery = `
        SELECT COUNT(*) as total
        FROM lectures l
        ${whereClause}
      `;
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      const lecturesQuery = `
        SELECT
          l.*,
          COUNT(DISTINCT sl.student_id) as current_students,
          GROUP_CONCAT(
            DISTINCT CONCAT(i.id, ':', i.name)
            ORDER BY i.name
            SEPARATOR '|'
          ) as instructor_info,
          GROUP_CONCAT(
            DISTINCT CONCAT(s.id, ':', s.name)
            ORDER BY s.name
            SEPARATOR '|'
          ) as student_info
        FROM lectures l
        LEFT JOIN instructor_lectures il ON l.id = il.lecture_id AND il.is_active = true AND il.tenant_id = l.tenant_id
        LEFT JOIN instructors i ON il.instructor_id = i.id AND i.is_active = true
        LEFT JOIN student_lectures sl ON l.id = sl.lecture_id AND sl.is_active = true
        LEFT JOIN students s ON sl.student_id = s.id AND s.is_active = true
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const lectures = await query(lecturesQuery, queryParams);

      const processedLectures = lectures.map(lecture => {
        const students = [];
        const instructors = [];

        // ✅ 복수 강사 처리
        if (lecture.instructor_info) {
          const instructorInfos = lecture.instructor_info.split('|');
          instructorInfos.forEach(info => {
            const [id, name] = info.split(':');
            if (id && name) {
              instructors.push({ id: parseInt(id), name });
            }
          });
        }

        if (lecture.student_info) {
          const studentInfos = lecture.student_info.split('|');
          studentInfos.forEach(info => {
            const [id, name] = info.split(':');
            students.push({ id, name });
          });
        }

        return {
          ...lecture,
          instructor: instructors.length > 0 ? instructors.map(i => i.name).join(', ') : '미배정',
          instructorIds: instructors.map(i => i.id),
          instructors: instructors,
          enrolledStudents: students.map(s => s.id),
          students: students.map(s => s.name).join(', ') || '등록된 학생 없음',
          instructor_info: undefined,
          student_info: undefined
        };
      });

      return {
        lectures: processedLectures,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('LectureModel.getLectures error:', error);
      throw error;
    }
  }

  // 강의 상세 조회
  static async getLectureById(id, tenantId = null) {
    try {
      let whereClauses = ['l.id = ?', 'l.is_active = true'];
      let params = [id];

      if (tenantId) {
        whereClauses.push('l.tenant_id = ?');
        params.push(tenantId);
      }

      const lectureQuery = `
        SELECT
          l.*,
          COUNT(DISTINCT sl.student_id) as current_students,
          GROUP_CONCAT(
            DISTINCT CONCAT(i.id, ':', i.name)
            ORDER BY i.name
            SEPARATOR '|'
          ) as instructor_info,
          GROUP_CONCAT(
            DISTINCT CONCAT(s.id, ':', s.name)
            ORDER BY s.name
            SEPARATOR '|'
          ) as student_info
        FROM lectures l
        LEFT JOIN instructor_lectures il ON l.id = il.lecture_id AND il.is_active = true AND il.tenant_id = l.tenant_id
        LEFT JOIN instructors i ON il.instructor_id = i.id AND i.is_active = true
        LEFT JOIN student_lectures sl ON l.id = sl.lecture_id AND sl.is_active = true
        LEFT JOIN students s ON sl.student_id = s.id AND s.is_active = true
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY l.id
      `;

      const lectures = await query(lectureQuery, params);
      if (lectures.length === 0) {
        return null;
      }

      const lecture = lectures[0];
      const students = [];
      const instructors = [];

      // ✅ 복수 강사 처리
      if (lecture.instructor_info) {
        const instructorInfos = lecture.instructor_info.split('|');
        instructorInfos.forEach(info => {
          const [id, name] = info.split(':');
          if (id && name) {
            instructors.push({ id: parseInt(id), name });
          }
        });
      }

      if (lecture.student_info) {
        const studentInfos = lecture.student_info.split('|');
        studentInfos.forEach(info => {
          const [studentId, name] = info.split(':');
          students.push({ id: studentId, name });
        });
      }

      return {
        ...lecture,
        instructor: instructors.length > 0 ? instructors.map(i => i.name).join(', ') : '미배정',
        instructorIds: instructors.map(i => i.id),
        instructors: instructors,
        enrolledStudents: students.map(s => s.id),
        students: students.map(s => s.name).join(', ') || '등록된 학생 없음',
        instructor_info: undefined,
        student_info: undefined
      };
    } catch (error) {
      console.error('LectureModel.getLectureById error:', error);
      throw error;
    }
  }

  // 강의 추가
  static async createLecture(lectureData, tenantId) {
    try {
      const result = await transaction(async (conn) => {
        const {
          enrolledStudents = [],
          instructorIds = [],
          ...basicData
        } = lectureData;

        const lectureId = basicData.id || `lecture_${Date.now()}`;

        const insertQuery = `
          INSERT INTO lectures (
            id, name, teacher_name, subject,
            schedule, fee, capacity, description, tenant_id, instructor_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
          lectureId,
          basicData.name,
          basicData.teacherName || basicData.teacher || basicData.instructor || null,
          basicData.subject || null,
          basicData.schedule || null,
          basicData.fee || 0,
          basicData.capacity || basicData.maxStudents || 0,
          basicData.description || null,
          tenantId,
          Array.isArray(instructorIds) && instructorIds.length > 0 
            ? instructorIds[0] 
            : basicData.instructorId || null
        ];

        await conn.execute(insertQuery, insertParams);

        // ✅ 복수 강사 저장
        if (Array.isArray(instructorIds) && instructorIds.length > 0) {
          for (const instructorId of instructorIds) {
            await conn.execute(
              'INSERT INTO instructor_lectures (tenant_id, instructor_id, lecture_id, is_active) VALUES (?, ?, ?, true)',
              [tenantId, instructorId, lectureId]
            );
          }
        }

        // 학생 연결
        if (enrolledStudents.length > 0) {
          for (const studentId of enrolledStudents) {
            await conn.execute(
              'INSERT INTO student_lectures (tenant_id, student_id, lecture_id) VALUES (?, ?, ?)',
              [tenantId, studentId, lectureId]
            );
          }

          await conn.execute(`
            UPDATE lectures
            SET current_students = ?
            WHERE id = ?
          `, [enrolledStudents.length, lectureId]);

          for (const studentId of enrolledStudents) {
            const [feeResult] = await conn.execute(`
              SELECT SUM(l.fee) as total_fee
              FROM lectures l
              JOIN student_lectures sl ON l.id = sl.lecture_id
              WHERE sl.student_id = ? AND sl.is_active = true AND l.is_active = true
            `, [studentId]);

            const totalFee = feeResult[0]?.total_fee || 0;
            await conn.execute(
              'UPDATE students SET class_fee = ? WHERE id = ?',
              [totalFee, studentId]
            );
          }
        }

        return lectureId;
      });

      return await this.getLectureById(result, tenantId);
    } catch (error) {
      console.error('LectureModel.createLecture error:', error);
      throw error;
    }
  }

  // 강의 정보 수정
  static async updateLecture(id, lectureData, tenantId = null) {
    try {
      const result = await transaction(async (conn) => {
        const {
          enrolledStudents = [],
          instructorIds = [],
          ...basicData
        } = lectureData;

        if (tenantId) {
          const [lectures] = await conn.execute(
            'SELECT id FROM lectures WHERE id = ? AND tenant_id = ? AND is_active = true',
            [id, tenantId]
          );

          if (!lectures || lectures.length === 0) {
            throw new Error('해당 강의를 찾을 수 없거나 수정 권한이 없습니다.');
          }
        }

        // 강의 기본 정보 업데이트
        const updateQuery = `
          UPDATE lectures SET
            name = ?, subject = ?, description = ?, instructor_id = ?,
            teacher_name = ?, schedule = ?, fee = ?, capacity = ?,
            updated_at = NOW()
          WHERE id = ? AND is_active = true
        `;

        const updateParams = [
          basicData.name,
          basicData.subject || null,
          basicData.description || null,
          Array.isArray(instructorIds) && instructorIds.length > 0 
            ? instructorIds[0] 
            : basicData.instructorId || null,
          basicData.teacherName || basicData.instructor || null,
          basicData.schedule || null,
          basicData.fee || 0,
          basicData.capacity || basicData.maxStudents || 0,
          id
        ];

        await conn.execute(updateQuery, updateParams);

        // ✅ 복수 강사 업데이트
        await conn.execute(
          'UPDATE instructor_lectures SET is_active = false WHERE lecture_id = ? AND tenant_id = ?',
          [id, tenantId]
        );

        if (Array.isArray(instructorIds) && instructorIds.length > 0) {
          for (const instructorId of instructorIds) {
            const [existing] = await conn.execute(
              'SELECT id FROM instructor_lectures WHERE instructor_id = ? AND lecture_id = ? AND tenant_id = ?',
              [instructorId, id, tenantId]
            );

            if (existing && existing.length > 0) {
              await conn.execute(
                'UPDATE instructor_lectures SET is_active = true WHERE instructor_id = ? AND lecture_id = ? AND tenant_id = ?',
                [instructorId, id, tenantId]
              );
            } else {
              await conn.execute(
                'INSERT INTO instructor_lectures (tenant_id, instructor_id, lecture_id, is_active) VALUES (?, ?, ?, true)',
                [tenantId, instructorId, id]
              );
            }
          }
        }

        // 기존 학생 연결 비활성화
        const [oldStudents] = await conn.execute(
          'SELECT student_id FROM student_lectures WHERE lecture_id = ? AND is_active = true',
          [id]
        );

        await conn.execute(
          'UPDATE student_lectures SET is_active = false WHERE lecture_id = ?',
          [id]
        );

        // 새로운 학생 연결
        if (enrolledStudents.length > 0) {
          for (const studentId of enrolledStudents) {
            const [existing] = await conn.execute(
              'SELECT id FROM student_lectures WHERE student_id = ? AND lecture_id = ?',
              [studentId, id]
            );

            if (existing && existing.length > 0) {
              await conn.execute(
                'UPDATE student_lectures SET is_active = true WHERE student_id = ? AND lecture_id = ?',
                [studentId, id]
              );
            } else {
              await conn.execute(
                'INSERT INTO student_lectures (tenant_id, student_id, lecture_id) VALUES (?, ?, ?)',
                [tenantId, studentId, id]
              );
            }
          }
        }

        // 현재 학생 수 업데이트
        await conn.execute(`
          UPDATE lectures
          SET current_students = (
            SELECT COUNT(*) FROM student_lectures
            WHERE lecture_id = ? AND is_active = true
          )
          WHERE id = ?
        `, [id, id]);

        // 영향받은 모든 학생들의 수강료 재계산
        const allAffectedStudents = new Set([
          ...oldStudents.map(s => s.student_id),
          ...enrolledStudents
        ]);

        for (const studentId of allAffectedStudents) {
          const [feeResult] = await conn.execute(`
            SELECT SUM(l.fee) as total_fee
            FROM lectures l
            JOIN student_lectures sl ON l.id = sl.lecture_id
            WHERE sl.student_id = ? AND sl.is_active = true AND l.is_active = true
          `, [studentId]);

          const totalFee = feeResult[0]?.total_fee || 0;
          await conn.execute(
            'UPDATE students SET class_fee = ? WHERE id = ?',
            [totalFee, studentId]
          );
        }

        return id;
      });

      return await this.getLectureById(result, tenantId);
    } catch (error) {
      console.error('LectureModel.updateLecture error:', error);
      throw error;
    }
  }

  // 강의 삭제
  static async deleteLecture(id, tenantId = null) {
    try {
      await transaction(async (conn) => {
        if (tenantId) {
          const [lectures] = await conn.execute(
            'SELECT id FROM lectures WHERE id = ? AND tenant_id = ? AND is_active = true',
            [id, tenantId]
          );

          if (!lectures || lectures.length === 0) {
            throw new Error('해당 강의를 찾을 수 없거나 삭제 권한이 없습니다.');
          }
        }

        const [students] = await conn.execute(
          'SELECT student_id FROM student_lectures WHERE lecture_id = ?',
          [id]
        );

        await conn.execute(
          'DELETE FROM student_lectures WHERE lecture_id = ?',
          [id]
        );

        await conn.execute(
          'DELETE FROM instructor_lectures WHERE lecture_id = ?',
          [id]
        );

        await conn.execute(
          'DELETE FROM lectures WHERE id = ?',
          [id]
        );

        for (const student of students) {
          const [feeResult] = await conn.execute(`
            SELECT SUM(l.fee) as total_fee
            FROM lectures l
            JOIN student_lectures sl ON l.id = sl.lecture_id
            WHERE sl.student_id = ? AND sl.is_active = true AND l.is_active = true
          `, [student.student_id]);

          const totalFee = feeResult[0]?.total_fee || 0;
          await conn.execute(
            'UPDATE students SET class_fee = ? WHERE id = ?',
            [totalFee, student.student_id]
          );
        }
      });

      return true;
    } catch (error) {
      console.error('LectureModel.deleteLecture error:', error);
      throw error;
    }
  }

  // 강의 존재 확인
  static async exists(id, tenantId = null) {
    try {
      let query_str = 'SELECT COUNT(*) as count FROM lectures WHERE id = ? AND is_active = true';
      let params = [id];

      if (tenantId) {
        query_str += ' AND tenant_id = ?';
        params.push(tenantId);
      }

      const [result] = await query(query_str, params);
      return result.count > 0;
    } catch (error) {
      console.error('LectureModel.exists error:', error);
      throw error;
    }
  }

  // 특정 강사의 강의 목록 조회
  static async getLecturesByInstructorId(instructorId) {
    try {
      const lecturesQuery = `
        SELECT l.*
        FROM lectures l
        WHERE l.instructor_id = ? AND l.is_active = true
        ORDER BY l.name
      `;

      return await query(lecturesQuery, [instructorId]);
    } catch (error) {
      console.error('LectureModel.getLecturesByInstructorId error:', error);
      throw error;
    }
  }

  // 특정 학생의 강의 목록 조회
  static async getLecturesByStudentId(studentId) {
    try {
      const lecturesQuery = `
        SELECT l.*
        FROM lectures l
        JOIN student_lectures sl ON l.id = sl.lecture_id
        WHERE sl.student_id = ? AND sl.is_active = true AND l.is_active = true
        ORDER BY l.name
      `;

      return await query(lecturesQuery, [studentId]);
    } catch (error) {
      console.error('LectureModel.getLecturesByStudentId error:', error);
      throw error;
    }
  }

  // 강의 통계 조회
  static async getLectureStats() {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_lectures,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_lectures,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_lectures,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_lectures,
          AVG(current_students) as avg_students_per_lecture,
          SUM(current_students) as total_enrolled_students
        FROM lectures
        WHERE is_active = true
      `;

      const [stats] = await query(statsQuery);
      return stats;
    } catch (error) {
      console.error('LectureModel.getLectureStats error:', error);
      throw error;
    }
  }
}

module.exports = LectureModel;
