const { query, transaction } = require('../config/database');

class LectureModel {
  // 강의 목록 조회 (페이지네이션, 검색 포함)
  static async getLectures({ page = 1, limit = 20, search = '', instructorId = '', status = '' }) {
    try {
      const offset = (page - 1) * limit;
      let whereClauses = ['l.is_active = true'];
      let queryParams = [];

      // 검색 조건
      if (search) {
        whereClauses.push('(l.name LIKE ? OR l.subject LIKE ? OR l.description LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      // 강사 필터
      if (instructorId) {
        whereClauses.push('l.instructor_id = ?');
        queryParams.push(instructorId);
      }

      // 상태 필터
      if (status) {
        whereClauses.push('l.status = ?');
        queryParams.push(status);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 총 개수 조회
      const countQuery = `
        SELECT COUNT(*) as total
        FROM lectures l
        ${whereClause}
      `;
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      // 강의 목록 조회 (강사 및 학생 정보 포함)
      const lecturesQuery = `
        SELECT
          l.*,
          i.name as instructor_name,
          i.id as instructor_id,
          COUNT(DISTINCT sl.student_id) as current_students,
          GROUP_CONCAT(
            DISTINCT CONCAT(s.id, ':', s.name)
            ORDER BY s.name
            SEPARATOR '|'
          ) as student_info
        FROM lectures l
        LEFT JOIN instructors i ON l.instructor_id = i.id AND i.is_active = true
        LEFT JOIN student_lectures sl ON l.id = sl.lecture_id AND sl.is_active = true
        LEFT JOIN students s ON sl.student_id = s.id AND s.is_active = true
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const lectures = await query(lecturesQuery, queryParams);

      // 학생 정보 파싱
      const processedLectures = lectures.map(lecture => {
        const students = [];

        if (lecture.student_info) {
          const studentInfos = lecture.student_info.split('|');
          studentInfos.forEach(info => {
            const [id, name] = info.split(':');
            students.push({ id, name });
          });
        }

        return {
          ...lecture,
          instructor: lecture.instructor_name || '미배정',
          enrolledStudents: students.map(s => s.id),
          students: students.map(s => s.name).join(', ') || '등록된 학생 없음',
          student_info: undefined // 임시 필드 제거
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
  static async getLectureById(id) {
    try {
      const lectureQuery = `
        SELECT
          l.*,
          i.name as instructor_name,
          i.id as instructor_id,
          COUNT(DISTINCT sl.student_id) as current_students,
          GROUP_CONCAT(
            DISTINCT CONCAT(s.id, ':', s.name)
            ORDER BY s.name
            SEPARATOR '|'
          ) as student_info
        FROM lectures l
        LEFT JOIN instructors i ON l.instructor_id = i.id AND i.is_active = true
        LEFT JOIN student_lectures sl ON l.id = sl.lecture_id AND sl.is_active = true
        LEFT JOIN students s ON sl.student_id = s.id AND s.is_active = true
        WHERE l.id = ? AND l.is_active = true
        GROUP BY l.id
      `;

      const lectures = await query(lectureQuery, [id]);
      if (lectures.length === 0) {
        return null;
      }

      const lecture = lectures[0];
      const students = [];

      if (lecture.student_info) {
        const studentInfos = lecture.student_info.split('|');
        studentInfos.forEach(info => {
          const [studentId, name] = info.split(':');
          students.push({ id: studentId, name });
        });
      }

      return {
        ...lecture,
        instructor: lecture.instructor_name || '미배정',
        enrolledStudents: students.map(s => s.id),
        students: students.map(s => s.name).join(', ') || '등록된 학생 없음',
        student_info: undefined // 임시 필드 제거
      };
    } catch (error) {
      console.error('LectureModel.getLectureById error:', error);
      throw error;
    }
  }

  // 강의 추가
  static async createLecture(lectureData) {
    try {
      const result = await transaction(async (conn) => {
        const {
          enrolledStudents = [],
          ...basicData
        } = lectureData;

        // 강의 기본 정보 삽입 (실제 테이블 구조: id는 VARCHAR(50))
        const lectureId = basicData.id || `lecture_${Date.now()}`;

        const insertQuery = `
          INSERT INTO lectures (
            id, name, teacher_name, subject,
            schedule, fee, capacity, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
          lectureId,
          basicData.name,
          basicData.teacherName || basicData.teacher || basicData.instructor || null,
          basicData.subject || null,
          basicData.schedule || null,
          basicData.fee || 0,
          basicData.capacity || basicData.maxStudents || 0,
          basicData.description || null
        ];

        await conn.execute(insertQuery, insertParams);

        // 강사-강의 연결은 lectures 테이블의 instructor_id 컬럼에서 처리됨 (불필요)
        // instructor_lectures 테이블 사용 안 함

        // 학생 연결
        if (enrolledStudents.length > 0) {
          for (const studentId of enrolledStudents) {
            await conn.execute(
              'INSERT INTO student_lectures (student_id, lecture_id) VALUES (?, ?)',
              [studentId, lectureId]
            );
          }

          // 현재 학생 수 업데이트
          await conn.execute(`
            UPDATE lectures
            SET current_students = ?
            WHERE id = ?
          `, [enrolledStudents.length, lectureId]);

          // 각 학생의 총 수강료 재계산
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

      // 생성된 강의 정보 반환
      return await this.getLectureById(result);
    } catch (error) {
      console.error('LectureModel.createLecture error:', error);
      throw error;
    }
  }

  // 강의 정보 수정
  static async updateLecture(id, lectureData) {
    try {
      const result = await transaction(async (conn) => {
        const {
          enrolledStudents = [],
          ...basicData
        } = lectureData;

        // 강의 기본 정보 업데이트 (실제 테이블 구조에 맞춤)
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
          basicData.instructorId || null,
          basicData.teacherName || basicData.instructor || null,
          basicData.schedule || null,
          basicData.fee || 0,
          basicData.capacity || basicData.maxStudents || 0,
          id
        ];

        await conn.execute(updateQuery, updateParams);

        // 강사-강의 연결은 lectures 테이블의 instructor_id 컬럼에서 처리됨 (불필요)
        // instructor_lectures 테이블 사용 안 함

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

            if (existing.length > 0) {
              await conn.execute(
                'UPDATE student_lectures SET is_active = true WHERE student_id = ? AND lecture_id = ?',
                [studentId, id]
              );
            } else {
              await conn.execute(
                'INSERT INTO student_lectures (student_id, lecture_id) VALUES (?, ?)',
                [studentId, id]
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

      // 수정된 강의 정보 반환
      return await this.getLectureById(result);
    } catch (error) {
      console.error('LectureModel.updateLecture error:', error);
      throw error;
    }
  }

  // 강의 삭제 (소프트 삭제)
  // 강의 삭제 (완전 삭제)
  static async deleteLecture(id) {
    try {
      await transaction(async (conn) => {
        // 등록된 학생들 조회 (수강료 재계산용)
        const [students] = await conn.execute(
          'SELECT student_id FROM student_lectures WHERE lecture_id = ?',
          [id]
        );

        // 학생-강의 연결 완전 삭제
        await conn.execute(
          'DELETE FROM student_lectures WHERE lecture_id = ?',
          [id]
        );

        // 강사-강의 연결 완전 삭제
        await conn.execute(
          'DELETE FROM instructor_lectures WHERE lecture_id = ?',
          [id]
        );

        // 강의 완전 삭제
        await conn.execute(
          'DELETE FROM lectures WHERE id = ?',
          [id]
        );

        // 영향받은 학생들의 수강료 재계산
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
  static async exists(id) {
    try {
      const [result] = await query(
        'SELECT COUNT(*) as count FROM lectures WHERE id = ? AND is_active = true',
        [id]
      );
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