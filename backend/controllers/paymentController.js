const PaymentModel = require('../models/paymentModel');

// 결제 목록 조회
const getPayments = async (req, res) => {
  try {
    const { page, limit, search, startDate, endDate } = req.query;
    const tenantId = req.user?.tenant_id; // 요청자의 tenant_id 가져오기

    const result = await PaymentModel.getPayments({
      page,
      limit,
      search,
      tenantId,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });

    console.log(`✅ 결제 목록 조회: 페이지 ${page}, ${result.payments.length}개 조회`);

  } catch (error) {
    console.error('getPayments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 결제 상세 조회
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await PaymentModel.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '결제 내역을 찾을 수 없습니다.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        payment
      }
    });

    console.log(`✅ 결제 상세 조회: ID ${id}`);

  } catch (error) {
    console.error('getPaymentById error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 결제 추가
const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const userId = req.user?.id; // 요청자의 user_id
    const tenantId = req.user?.tenant_id; // 요청자의 tenant_id

    console.log('🔍 결제 추가 요청 받음:');
    console.log('  - 상품:', paymentData.productName);
    console.log('  - 금액:', paymentData.totalAmount);
    console.log('  - user_id:', userId);
    console.log('  - tenant_id:', tenantId);

    // userId와 tenantId를 paymentData에 추가
    const fullPaymentData = {
      ...paymentData,
      userId,
      tenantId
    };

    const payment = await PaymentModel.createPayment(fullPaymentData);

    console.log('🔍 DB에 저장 후 반환된 결제 정보:');
    console.log('  - 상품:', payment.product_name);
    console.log('  - 금액:', payment.total_amount);
    console.log('  - 결제 ID:', payment.id);

    res.status(201).json({
      success: true,
      data: {
        payment
      }
    });

    console.log(`✅ 결제 추가 성공: ${payment.product_name} (ID: ${payment.id})`);

  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 처리 중 오류가 발생했습니다.'
      }
    });
  }
};

// 결제 정보 수정
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    console.log('🔍 결제 수정 요청 받음:');
    console.log('  - 결제 ID:', id);
    console.log('  - 수정 데이터:', paymentData);

    // 결제 존재 확인
    const exists = await PaymentModel.exists(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '결제 내역을 찾을 수 없습니다.'
        }
      });
    }

    const payment = await PaymentModel.updatePayment(id, paymentData);

    res.json({
      success: true,
      data: {
        payment
      }
    });

    console.log(`✅ 결제 수정 성공: ID ${id}`);

  } catch (error) {
    console.error('updatePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 수정 중 오류가 발생했습니다.'
      }
    });
  }
};

// 결제 삭제
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // 결제 존재 확인
    const exists = await PaymentModel.exists(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '결제 내역을 찾을 수 없습니다.'
        }
      });
    }

    await PaymentModel.deletePayment(id);

    res.json({
      success: true,
      message: '결제 내역이 삭제되었습니다.'
    });

    console.log(`✅ 결제 삭제 성공: ID ${id}`);

  } catch (error) {
    console.error('deletePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 삭제 중 오류가 발생했습니다.'
      }
    });
  }
};

// 결제 통계 조회
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user?.tenant_id;

    const stats = await PaymentModel.getPaymentStats(startDate, endDate, tenantId);

    res.json({
      success: true,
      data: {
        stats
      }
    });

    console.log(`✅ 결제 통계 조회 성공`);

  } catch (error) {
    console.error('getPaymentStats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '결제 통계 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
};
