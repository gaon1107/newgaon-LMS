const { query, transaction } = require('../config/database');

class StudentModel {
  // 학생 목록 조회 (페이지네이션, 검색 포함)
  static async getStudents({ page = 1, limit = 20, search = '', classId = '', tenantId = '' }) {
    try {
      const offset = (page - 1) * limit;
      let whereClauses = ['s.is_active = true'];
      let queryParams = [];

      // ✅ tenant_id 필터 추가!
      if (tenantId) {
        whereClauses.push('s.tenant_id = ?');
        queryParams.push(tenantId);
      }

      // 검색 조건
      if (search) {
        whereClauses.push('(s.name LIKE ? OR s.school LIKE ? OR s.parent_phone LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      // 반 필터
      if (classId) {
        whereClauses.push('EXISTS (SELECT 1 FROM student_lectures sl WHERE sl.student_id = s.id AND sl.lecture_id = ? AND sl.is_active = true)');
        queryParams.push(classId);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 총 개수 조회
      const countQuery = `
        SELECT COUNT(*) as total
        FROM students s
        ${whereClause}
      `;
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      // 학생 목록 조회 (강의 정보 포함)
      const studentsQuery = `
        SELECT
          s.*,
          GROUP_CONCAT(
            DISTINCT CONCAT(l.id, ':', l.name)
            ORDER BY l.name
            SEPARATOR '|'
          ) as lecture_info
        FROM students s
        LEFT JOIN student_lectures sl ON s.id = sl.student_id AND sl.is_active = true
        LEFT JOIN lectures l ON sl.lecture_id = l.id AND l.is_active = true
        ${whereClause}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const students = await query(studentsQuery, queryParams);

      // 강의 정보 파싱 및 수강료 계산
      const processedStudents = students.map(student => {
        const lectures = [];
        let totalFee = 0;

        if (student.lecture_info) {
          const lectureInfos = student.lecture_info.split('|');
          lectureInfos.forEach(info => {
            const [id, name] = info.split(':');
            lectures.push({ id, name });
          });
        }

        // 강의별 수강료 조회 (별도 쿼리 필요 시)
        totalFee = student.class_fee || 0;

        // 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
        const formatDate = (date) => {
          if (!date) return null
          const d = new Date(date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        // snake_case를 camelCase로 변환
        return {
          id: student.id,
          name: student.name,
          school: student.school,
          grade: student.grade,
          department: student.department,
          phone: student.phone,
          parentPhone: student.parent_phone,
          attendanceNumber: student.attendance_number,
          email: student.email,
          birthDate: formatDate(student.birth_date),
          address: student.address,
          notes: student.notes,
          paymentDueDate: formatDate(student.payment_due_date),
          sendPaymentNotification: student.send_payment_notification,
          profileImage: student.profile_image_url || null,
          selectedClasses: lectures.map(l => l.id),
          class: lectures.map(l => l.name).join(', ') || '미등록',
          classFee: totalFee,
          autoMessages: {
            attendance: !!student.auto_attendance_msg,
            outing: !!student.auto_outing_msg,
            imagePost: !!student.auto_image_msg,
            studyMonitoring: !!student.auto_study_monitoring
          }
        };
      });

      return {
        students: processedStudents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('StudentModel.getStudents error:', error);
      throw error;
    }
  }

  // 학생 상세 조회
  static async getStudentById(id) {
    try {
      const studentQuery = `
        SELECT
          s.*,
          GROUP_CONCAT(
            DISTINCT CONCAT(l.id, ':', l.name, ':', l.fee)
            ORDER BY l.name
            SEPARATOR '|'
          ) as lecture_info
        FROM students s
        LEFT JOIN student_lectures sl ON s.id = sl.student_id AND sl.is_active = true
        LEFT JOIN lectures l ON sl.lecture_id = l.id AND l.is_active = true
        WHERE s.id = ? AND s.is_active = true
        GROUP BY s.id
      `;

      const students = await query(studentQuery, [id]);
      if (students.length === 0) {
        return null;
      }

      const student = students[0];
      const lectures = [];
      let totalFee = 0;

      if (student.lecture_info) {
        const lectureInfos = student.lecture_info.split('|');
        lectureInfos.forEach(info => {
          const [lectureId, name, fee] = info.split(':');
          lectures.push({ id: lectureId, name });
          totalFee += parseInt(fee) || 0;
        });
      }

      // snake_case를 camelCase로 변환
      return {
        id: student.id,
        name: student.name,
        school: student.school,
        grade: student.grade,
        department: student.department,
        phone: student.phone,
        parentPhone: student.parent_phone,
        attendanceNumber: student.attendance_number,
        email: student.email,
        birthDate: student.birth_date,
        address: student.address,
        notes: student.notes,
        paymentDueDate: student.payment_due_date,
        sendPaymentNotification: student.send_payment_notification,
        profileImage: student.profile_image_url || null,
        selectedClasses: lectures.map(l => l.id),
        class: lectures.map(l => l.name).join(', ') || '미등록',
        classFee: totalFee,
        autoMessages: {
          attendance: !!student.auto_attendance_msg,
          outing: !!student.auto_outing_msg,
          imagePost: !!student.auto_image_msg,
          studyMonitoring: !!student.auto_study_monitoring
        }
      };
    } catch (error) {
      console.error('StudentModel.getStudentById error:', error);
      throw error;
    }
  }

  // 학생 추가
  static async createStudent(studentData, tenantId) {
    try {
      const result = await transaction(async (conn) => {
        const {
          selectedClasses = [],
          autoMessages = {},
          ...basicData
        } = studentData;

        // 출결번호 생성 (중복 확인)
        let attendanceNumber = basicData.attendanceNumber;
        if (!attendanceNumber) {
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 100) {
            attendanceNumber = Math.floor(1000 + Math.random() * 9000).toString();

            const [existing] = await conn.execute(
              'SELECT id FROM students WHERE attendance_number = ? AND is_active = true',
              [attendanceNumber]
            );

            if (existing.length === 0) {
              isUnique = true;
            }
            attempts++;
          }

          if (!isUnique) {
            throw new Error('고유한 출결번호 생성에 실패했습니다.');
          }
        } else {
          // 사용자가 제공한 출결번호 중복 확인 (활성 학생만)
          const [existing] = await conn.execute(
            'SELECT id FROM students WHERE attendance_number = ? AND is_active = true',
            [attendanceNumber]
          );

          if (existing.length > 0) {
            throw new Error('이미 사용 중인 출결번호입니다.');
          }
        }

        // 학생 기본 정보 삽입
        const insertQuery = `
          INSERT INTO students (
            tenant_id, name, school, grade, department, phone, parent_phone, attendance_number, email,
            birth_date, address, notes, payment_due_date, send_payment_notification,
            profile_image_url, auto_attendance_msg, auto_outing_msg,
            auto_image_msg, auto_study_monitoring, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `;

        const insertParams = [
          tenantId,
          basicData.name,
          basicData.school || null,
          basicData.grade || null,
          basicData.department || null,
          basicData.phone || null,
          basicData.parentPhone,
          attendanceNumber,
          basicData.email || null,
          basicData.birthDate || null,
          basicData.address || null,
          basicData.notes || null,
          basicData.paymentDueDate || null,
          basicData.sendPaymentNotification !== false,
          basicData.profileImage || basicData.profile_image_url || null,
          autoMessages.attendance !== false,
          autoMessages.outing === true,
          autoMessages.imagePost === true,
          autoMessages.studyMonitoring === true
        ];

        const [insertResult] = await conn.execute(insertQuery, insertParams);
        const studentId = insertResult.insertId;

        // 강의 연결
        if (selectedClasses.length > 0) {
          for (const lectureId of selectedClasses) {
            await conn.execute(
              'INSERT INTO student_lectures (student_id, lecture_id) VALUES (?, ?)',
              [studentId, lectureId]
            );
          }

          // 강의별 현재 학생 수 업데이트
          for (const lectureId of selectedClasses) {
            await conn.execute(`
              UPDATE lectures
              SET current_students = (
                SELECT COUNT(*) FROM student_lectures
                WHERE lecture_id = ? AND is_active = true
              )
              WHERE id = ?
            `, [lectureId, lectureId]);
          }

          // 총 수강료 계산 및 업데이트
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

        return studentId;
      });

      // 생성된 학생 정보 반환
      return await this.getStudentById(result);
    } catch (error) {
      console.error('StudentModel.createStudent error:', error);
      throw error;
    }
  }

  // 학생 정보 수정
  static async updateStudent(id, studentData) {
    try {
      const result = await transaction(async (conn) => {
        const {
          selectedClasses = [],
          autoMessages = {},
          ...basicData
        } = studentData;

        // 출결번호 중복 확인 (수정 시, 활성 학생만)
        if (basicData.attendanceNumber) {
          const [existing] = await conn.execute(
            'SELECT id FROM students WHERE attendance_number = ? AND id != ? AND is_active = true',
            [basicData.attendanceNumber, id]
          );

          if (existing.length > 0) {
            throw new Error('이미 사용 중인 출결번호입니다.');
          }
        }

        // 학생 기본 정보 업데이트
        const updateQuery = `
          UPDATE students SET
            name = ?, school = ?, grade = ?, department = ?, phone = ?,
            parent_phone = ?, attendance_number = ?, email = ?, birth_date = ?, address = ?,
            notes = ?, payment_due_date = ?, send_payment_notification = ?,
            profile_image_url = ?, auto_attendance_msg = ?, auto_outing_msg = ?,
            auto_image_msg = ?, auto_study_monitoring = ?, updated_at = NOW()
          WHERE id = ? AND is_active = true
        `;

        const updateParams = [
          basicData.name,
          basicData.school || null,
          basicData.grade || null,
          basicData.department || null,
          basicData.phone || null,
          basicData.parentPhone,
          basicData.attendanceNumber || null,
          basicData.email || null,
          basicData.birthDate || null,
          basicData.address || null,
          basicData.notes || null,
          basicData.paymentDueDate || null,
          basicData.sendPaymentNotification !== false,
          basicData.profileImage || basicData.profile_image_url || null,
          autoMessages.attendance !== false,
          autoMessages.outing === true,
          autoMessages.imagePost === true,
          autoMessages.studyMonitoring === true,
          id
        ];

        await conn.execute(updateQuery, updateParams);

        // 기존 강의 연결 비활성화
        await conn.execute(
          'UPDATE student_lectures SET is_active = false WHERE student_id = ?',
          [id]
        );

        // 새로운 강의 연결
        if (selectedClasses.length > 0) {
          for (const lectureId of selectedClasses) {
            // 기존 연결이 있으면 활성화, 없으면 새로 생성
            const [existing] = await conn.execute(
              'SELECT id FROM student_lectures WHERE student_id = ? AND lecture_id = ?',
              [id, lectureId]
            );

            if (existing.length > 0) {
              await conn.execute(
                'UPDATE student_lectures SET is_active = true WHERE student_id = ? AND lecture_id = ?',
                [id, lectureId]
              );
            } else {
              await conn.execute(
                'INSERT INTO student_lectures (student_id, lecture_id) VALUES (?, ?)',
                [id, lectureId]
              );
            }
          }
        }

        // 모든 관련 강의의 현재 학생 수 업데이트
        const [relatedLectures] = await conn.execute(`
          SELECT DISTINCT lecture_id FROM student_lectures WHERE student_id = ?
        `, [id]);

        for (const lecture of relatedLectures) {
          await conn.execute(`
            UPDATE lectures
            SET current_students = (
              SELECT COUNT(*) FROM student_lectures
              WHERE lecture_id = ? AND is_active = true
            )
            WHERE id = ?
          `, [lecture.lecture_id, lecture.lecture_id]);
        }

        // 총 수강료 재계산 및 업데이트
        const [feeResult] = await conn.execute(`
          SELECT SUM(l.fee) as total_fee
          FROM lectures l
          JOIN student_lectures sl ON l.id = sl.lecture_id
          WHERE sl.student_id = ? AND sl.is_active = true AND l.is_active = true
        `, [id]);

        const totalFee = feeResult[0]?.total_fee || 0;
        await conn.execute(
          'UPDATE students SET class_fee = ? WHERE id = ?',
          [totalFee, id]
        );

        return id;
      });

      // 수정된 학생 정보 반환
      return await this.getStudentById(result);
    } catch (error) {
      console.error('StudentModel.updateStudent error:', error);
      throw error;
    }
  }

  // 학생 삭제 (완전 삭제)
  static async deleteStudent(id) {
    try {
      await transaction(async (conn) => {
        // 관련 강의들의 ID를 먼저 가져오기 (학생 수 업데이트용)
        const [relatedLectures] = await conn.execute(`
          SELECT DISTINCT lecture_id FROM student_lectures WHERE student_id = ?
        `, [id]);

        // 학생-강의 연결 완전 삭제
        await conn.execute(
          'DELETE FROM student_lectures WHERE student_id = ?',
          [id]
        );

        // 출석 기록 완전 삭제 (선택사항 - 출석 기록을 보존하려면 주석 처리)
        await conn.execute(
          'DELETE FROM attendance WHERE student_id = ?',
          [id]
        );

        // 학생 완전 삭제
        await conn.execute(
          'DELETE FROM students WHERE id = ?',
          [id]
        );

        // 관련 강의들의 현재 학생 수 업데이트
        for (const lecture of relatedLectures) {
          await conn.execute(`
            UPDATE lectures
            SET current_students = (
              SELECT COUNT(DISTINCT sl.student_id)
              FROM student_lectures sl
              JOIN students s ON sl.student_id = s.id
              WHERE sl.lecture_id = ? AND sl.is_active = true AND s.is_active = true
            )
            WHERE id = ?
          `, [lecture.lecture_id, lecture.lecture_id]);
        }
      });

      return true;
    } catch (error) {
      console.error('StudentModel.deleteStudent error:', error);
      throw error;
    }
  }

  // 학생 존재 확인
  static async exists(id) {
    try {
      const [result] = await query(
        'SELECT COUNT(*) as count FROM students WHERE id = ? AND is_active = true',
        [id]
      );
      return result.count > 0;
    } catch (error) {
      console.error('StudentModel.exists error:', error);
      throw error;
    }
  }

  // 출결번호로 학생 조회
  static async getStudentByAttendanceNumber(attendanceNumber) {
    try {
      const studentQuery = `
        SELECT
          s.*,
          GROUP_CONCAT(
            DISTINCT CONCAT(l.id, ':', l.name, ':', l.fee)
            ORDER BY l.name
            SEPARATOR '|'
          ) as lecture_info
        FROM students s
        LEFT JOIN student_lectures sl ON s.id = sl.student_id AND sl.is_active = true
        LEFT JOIN lectures l ON sl.lecture_id = l.id AND l.is_active = true
        WHERE s.attendance_number = ? AND s.is_active = true
        GROUP BY s.id
      `;

      const students = await query(studentQuery, [attendanceNumber]);
      if (students.length === 0) {
        return null;
      }

      const student = students[0];
      const lectures = [];
      let totalFee = 0;

      if (student.lecture_info) {
        const lectureInfos = student.lecture_info.split('|');
        lectureInfos.forEach(info => {
          const [lectureId, name, fee] = info.split(':');
          lectures.push({ id: lectureId, name });
          totalFee += parseInt(fee) || 0;
        });
      }

      // 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
      const formatDate = (date) => {
        if (!date) return null
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // snake_case를 camelCase로 변환
      return {
        id: student.id,
        name: student.name,
        school: student.school,
        grade: student.grade,
        department: student.department,
        phone: student.phone,
        parentPhone: student.parent_phone,
        attendanceNumber: student.attendance_number,
        email: student.email,
        birthDate: formatDate(student.birth_date),
        address: student.address,
        notes: student.notes,
        paymentDueDate: formatDate(student.payment_due_date),
        sendPaymentNotification: student.send_payment_notification,
        profileImage: student.profile_image_url || null,
        selectedClasses: lectures.map(l => l.id),
        class: lectures.map(l => l.name).join(', ') || '미등록',
        classFee: totalFee,
        autoMessages: {
          attendance: !!student.auto_attendance_msg,
          outing: !!student.auto_outing_msg,
          imagePost: !!student.auto_image_msg,
          studyMonitoring: !!student.auto_study_monitoring
        }
      };
    } catch (error) {
      console.error('StudentModel.getStudentByAttendanceNumber error:', error);
      throw error;
    }
  }

  // 출결번호 중복 확인
  static async checkAttendanceNumberExists(attendanceNumber, excludeId = null) {
    try {
      let query_str = 'SELECT COUNT(*) as count FROM students WHERE attendance_number = ? AND is_active = true';
      let params = [attendanceNumber];

      if (excludeId) {
        query_str += ' AND id != ?';
        params.push(excludeId);
      }

      const [result] = await query(query_str, params);
      return result.count > 0;
    } catch (error) {
      console.error('StudentModel.checkAttendanceNumberExists error:', error);
      throw error;
    }
  }
}

module.exports = StudentModel;