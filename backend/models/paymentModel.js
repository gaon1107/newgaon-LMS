const { query, transaction } = require('../config/database');

class PaymentModel {
  // 결제 목록 조회 (페이지네이션, 검색 포함)
  static async getPayments({ page = 1, limit = 20, search = '', tenantId = '', startDate = '', endDate = '' }) {
    try {
      const offset = (page - 1) * limit;
      let whereClauses = ['p.is_active = true'];
      let queryParams = [];

      // tenant_id 필터
      if (tenantId) {
        whereClauses.push('p.tenant_id = ?');
        queryParams.push(tenantId);
      }

      // 검색 조건 (상품명, 결제방법)
      if (search) {
        whereClauses.push('(p.product_name LIKE ? OR p.payment_method LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      // 날짜 범위 필터
      if (startDate) {
        whereClauses.push('DATE(p.payment_date) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClauses.push('DATE(p.payment_date) <= ?');
        queryParams.push(endDate);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 총 개수 조회
      const countQuery = `
        SELECT COUNT(*) as total
        FROM payments p
        ${whereClause}
      `;
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      // 결제 목록 조회
      const paymentsQuery = `
        SELECT
          p.*,
          u.username,
          u.email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        ${whereClause}
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const payments = await query(paymentsQuery, queryParams);

      // 날짜를 YYYY-MM-DD 형식으로 변환
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      const processedPayments = payments.map(payment => ({
        ...payment,
        payment_date: formatDate(payment.payment_date),
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }));

      return {
        payments: processedPayments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('PaymentModel.getPayments error:', error);
      throw error;
    }
  }

  // 결제 상세 조회
  static async getPaymentById(id) {
    try {
      const paymentQuery = `
        SELECT
          p.*,
          u.username,
          u.email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND p.is_active = true
      `;

      const payments = await query(paymentQuery, [id]);
      if (payments.length === 0) {
        return null;
      }

      return payments[0];
    } catch (error) {
      console.error('PaymentModel.getPaymentById error:', error);
      throw error;
    }
  }

  // 결제 추가
  static async createPayment(paymentData) {
    try {
      const insertQuery = `
        INSERT INTO payments (
          user_id,
          tenant_id,
          product_id,
          product_name,
          term_months,
          term_name,
          payment_method,
          original_amount,
          discount_amount,
          subtotal_amount,
          tax_amount,
          total_amount,
          payment_date,
          payment_status,
          promotion_code,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        paymentData.userId || null,
        paymentData.tenantId || null,
        paymentData.productId || null,
        paymentData.productName,
        paymentData.termMonths,
        paymentData.termName,
        paymentData.paymentMethod,
        paymentData.originalAmount || 0,
        paymentData.discountAmount || 0,
        paymentData.subtotalAmount || 0,
        paymentData.taxAmount || 0,
        paymentData.totalAmount,
        paymentData.paymentDate || new Date(),
        paymentData.paymentStatus || 'completed',
        paymentData.promotionCode || null,
        paymentData.notes || null
      ];

      const result = await query(insertQuery, insertParams);

      // 생성된 결제 정보 반환
      return await this.getPaymentById(result.insertId);
    } catch (error) {
      console.error('PaymentModel.createPayment error:', error);
      throw error;
    }
  }

  // 결제 정보 수정
  static async updatePayment(id, paymentData) {
    try {
      const updateQuery = `
        UPDATE payments SET
          payment_status = ?,
          notes = ?,
          updated_at = NOW()
        WHERE id = ? AND is_active = true
      `;

      const updateParams = [
        paymentData.paymentStatus || 'completed',
        paymentData.notes || null,
        id
      ];

      await query(updateQuery, updateParams);

      // 수정된 결제 정보 반환
      return await this.getPaymentById(id);
    } catch (error) {
      console.error('PaymentModel.updatePayment error:', error);
      throw error;
    }
  }

  // 결제 삭제 (소프트 삭제)
  static async deletePayment(id, tenantId = null) {
    try {
      let query_str = 'UPDATE payments SET is_active = false WHERE id = ?';
      let params = [id];

      // ✅ tenant_id 필터링 추가
      if (tenantId) {
        query_str += ' AND tenant_id = ?';
        params.push(tenantId);
      }

      await query(query_str, params);

      return true;
    } catch (error) {
      console.error('PaymentModel.deletePayment error:', error);
      throw error;
    }
  }

  // 결제 존재 확인
  static async exists(id) {
    try {
      const [result] = await query(
        'SELECT COUNT(*) as count FROM payments WHERE id = ? AND is_active = true',
        [id]
      );
      return result.count > 0;
    } catch (error) {
      console.error('PaymentModel.exists error:', error);
      throw error;
    }
  }

  // 사용자별 결제 내역 조회
  static async getPaymentsByUserId(userId) {
    try {
      const paymentsQuery = `
        SELECT *
        FROM payments
        WHERE user_id = ? AND is_active = true
        ORDER BY payment_date DESC, created_at DESC
      `;

      return await query(paymentsQuery, [userId]);
    } catch (error) {
      console.error('PaymentModel.getPaymentsByUserId error:', error);
      throw error;
    }
  }

  // 결제 통계 조회
  static async getPaymentStats(startDate = null, endDate = null, tenantId = null) {
    try {
      let whereClauses = ['is_active = true'];
      let queryParams = [];

      if (tenantId) {
        whereClauses.push('tenant_id = ?');
        queryParams.push(tenantId);
      }

      if (startDate) {
        whereClauses.push('DATE(payment_date) >= ?');
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClauses.push('DATE(payment_date) <= ?');
        queryParams.push(endDate);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const statsQuery = `
        SELECT
          COUNT(*) as total_payments,
          COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_payment_amount
        FROM payments
        ${whereClause}
      `;

      const [stats] = await query(statsQuery, queryParams);
      return stats;
    } catch (error) {
      console.error('PaymentModel.getPaymentStats error:', error);
      throw error;
    }
  }
}

module.exports = PaymentModel;
