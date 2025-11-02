const { query } = require('../config/database');

class StudentPaymentModel {
  // ✅ 당월 전체 학생 납부 현황 조회
  static async getCurrentMonthPayments(tenantId, yearMonth) {
    try {
      // ✅ tenant_id 필수 확인
      if (!tenantId) throw new Error('tenant_id is required');

      const paymentsQuery = `
        SELECT
          s.id as student_id,
          s.name as student_name,
          s.student_number,
          s.grade,
          COALESCE(SUM(sp.amount), 0) as total_paid,
          CASE
            WHEN SUM(sp.amount) > 0 THEN '완납'
            ELSE '미납'
          END as payment_status
        FROM students s
        LEFT JOIN student_payments sp ON s.id = sp.student_id
          AND sp.tenant_id = ?
          AND sp.payment_month = ?
          AND sp.is_active = true
        WHERE s.tenant_id = ? AND s.is_active = true
        GROUP BY s.id, s.name, s.student_number, s.grade
        ORDER BY s.name
      `;

      const payments = await query(paymentsQuery, [tenantId, yearMonth, tenantId]);
      return payments;

    } catch (error) {
      console.error('StudentPaymentModel.getCurrentMonthPayments error:', error);
      throw error;
    }
  }

  // ✅ 특정 학생의 기간별 납부 내역 조회
  static async getStudentPaymentHistory(tenantId, studentId, startMonth, endMonth) {
    try {
      if (!tenantId) throw new Error('tenant_id is required');
      if (!studentId) throw new Error('student_id is required');

      const historyQuery = `
        SELECT
          sp.id,
          sp.payment_date,
          sp.payment_month,
          sp.amount,
          sp.payment_method,
          sp.payment_status,
          sp.notes,
          l.name as lecture_name,
          sp.created_at
        FROM student_payments sp
        LEFT JOIN lectures l ON sp.lecture_id = l.id AND l.tenant_id = ?
        WHERE sp.tenant_id = ?
          AND sp.student_id = ?
          AND sp.payment_month BETWEEN ? AND ?
          AND sp.is_active = true
        ORDER BY sp.payment_date DESC
      `;

      const history = await query(historyQuery, [tenantId, tenantId, studentId, startMonth, endMonth]);
      return history;

    } catch (error) {
      console.error('StudentPaymentModel.getStudentPaymentHistory error:', error);
      throw error;
    }
  }

  // ✅ 학생의 신청 강의 목록 조회
  static async getStudentLectures(tenantId, studentId) {
    try {
      if (!tenantId) throw new Error('tenant_id is required');
      if (!studentId) throw new Error('student_id is required');

      const lecturesQuery = `
        SELECT DISTINCT
          l.id,
          l.name as lecture_name,
          l.price as lecture_price,
          l.start_date,
          l.end_date,
          l.schedule
        FROM lectures l
        INNER JOIN (
          SELECT DISTINCT lecture_id
          FROM student_payments
          WHERE tenant_id = ? AND student_id = ? AND is_active = true
        ) sp ON l.id = sp.lecture_id
        WHERE l.tenant_id = ? AND l.is_active = true
        ORDER BY l.name
      `;

      const lectures = await query(lecturesQuery, [tenantId, studentId, tenantId]);
      return lectures;

    } catch (error) {
      console.error('StudentPaymentModel.getStudentLectures error:', error);
      throw error;
    }
  }

  // ✅ 납부 추가
  static async createPayment(paymentData) {
    try {
      const {
        tenantId,
        studentId,
        lectureId,
        amount,
        paymentDate,
        paymentMonth,
        paymentMethod,
        paymentStatus = 'completed',
        notes
      } = paymentData;

      // ✅ tenant_id 필수 확인
      if (!tenantId) throw new Error('tenant_id is required');
      if (!studentId) throw new Error('student_id is required');

      const insertQuery = `
        INSERT INTO student_payments (
          tenant_id, student_id, lecture_id, amount, payment_date,
          payment_month, payment_method, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await query(insertQuery, [
        tenantId,
        studentId,
        lectureId || null,
        amount,
        paymentDate,
        paymentMonth,
        paymentMethod,
        paymentStatus,
        notes || null
      ]);

      return {
        id: result.insertId,
        ...paymentData
      };

    } catch (error) {
      console.error('StudentPaymentModel.createPayment error:', error);
      throw error;
    }
  }

  // ✅ 납부 수정
  static async updatePayment(paymentId, tenantId, paymentData) {
    try {
      if (!tenantId) throw new Error('tenant_id is required');

      const updateQuery = `
        UPDATE student_payments
        SET
          amount = ?,
          payment_date = ?,
          payment_month = ?,
          payment_method = ?,
          payment_status = ?,
          notes = ?,
          updated_at = NOW()
        WHERE id = ? AND tenant_id = ? AND is_active = true
      `;

      await query(updateQuery, [
        paymentData.amount,
        paymentData.paymentDate,
        paymentData.paymentMonth,
        paymentData.paymentMethod,
        paymentData.paymentStatus || 'completed',
        paymentData.notes || null,
        paymentId,
        tenantId
      ]);

      return { id: paymentId, ...paymentData };

    } catch (error) {
      console.error('StudentPaymentModel.updatePayment error:', error);
      throw error;
    }
  }

  // ✅ 납부 삭제 (소프트 삭제)
  static async deletePayment(paymentId, tenantId) {
    try {
      if (!tenantId) throw new Error('tenant_id is required');

      const deleteQuery = `
        UPDATE student_payments
        SET is_active = false, updated_at = NOW()
        WHERE id = ? AND tenant_id = ?
      `;

      await query(deleteQuery, [paymentId, tenantId]);

    } catch (error) {
      console.error('StudentPaymentModel.deletePayment error:', error);
      throw error;
    }
  }
}

module.exports = StudentPaymentModel;
