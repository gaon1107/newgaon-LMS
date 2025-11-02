const StudentPaymentModel = require('../models/studentPaymentModel');

// 당월 전체 학생 납부 현황 조회
const getCurrentMonthPayments = async (req, res) => {
  try {
    const { yearMonth } = req.query; // YYYY-MM 형식
    const tenantId = req.user?.tenant_id;

    if (!yearMonth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'yearMonth 파라미터가 필요합니다 (형식: YYYY-MM)'
        }
      });
    }

    const payments = await StudentPaymentModel.getCurrentMonthPayments(tenantId, yearMonth);

    res.json({
      success: true,
      data: {
        payments,
        yearMonth
      }
    });

    console.log(`✅ 당월 납부 현황 조회: ${yearMonth}, ${payments.length}명`);

  } catch (error) {
    console.error('getCurrentMonthPayments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '납부 현황 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 특정 학생의 기간별 납부 내역 + 신청 강의 조회
const getStudentPaymentInfo = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startMonth, endMonth } = req.query; // YYYY-MM 형식
    const tenantId = req.user?.tenant_id;

    if (!startMonth || !endMonth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startMonth, endMonth 파라미터가 필요합니다 (형식: YYYY-MM)'
        }
      });
    }

    // 납부 내역 조회
    const paymentHistory = await StudentPaymentModel.getStudentPaymentHistory(
      tenantId,
      studentId,
      startMonth,
      endMonth
    );

    // 신청 강의 목록 조회
    const lectures = await StudentPaymentModel.getStudentLectures(tenantId, studentId);

    res.json({
      success: true,
      data: {
        studentId: parseInt(studentId),
        paymentHistory,
        lectures,
        period: { startMonth, endMonth }
      }
    });

    console.log(`✅ 학생 납부 정보 조회: 학생ID ${studentId}, ${paymentHistory.length}건`);

  } catch (error) {
    console.error('getStudentPaymentInfo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '학생 납부 정보 조회 중 오류가 발생했습니다.'
      }
    });
  }
};

// 납부 추가
const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const tenantId = req.user?.tenant_id;

    const fullPaymentData = {
      ...paymentData,
      tenantId
    };

    const payment = await StudentPaymentModel.createPayment(fullPaymentData);

    res.status(201).json({
      success: true,
      data: {
        payment
      }
    });

    console.log(`✅ 납부 추가 성공: 학생ID ${payment.studentId}, 금액 ${payment.amount}`);

  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '납부 추가 중 오류가 발생했습니다.'
      }
    });
  }
};

// 납부 수정
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    const tenantId = req.user?.tenant_id;

    const payment = await StudentPaymentModel.updatePayment(id, tenantId, paymentData);

    res.json({
      success: true,
      data: {
        payment
      }
    });

    console.log(`✅ 납부 수정 성공: ID ${id}`);

  } catch (error) {
    console.error('updatePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '납부 수정 중 오류가 발생했습니다.'
      }
    });
  }
};

// 납부 삭제
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    await StudentPaymentModel.deletePayment(id, tenantId);

    res.json({
      success: true,
      message: '납부 내역이 삭제되었습니다.'
    });

    console.log(`✅ 납부 삭제 성공: ID ${id}`);

  } catch (error) {
    console.error('deletePayment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '납부 삭제 중 오류가 발생했습니다.'
      }
    });
  }
};

module.exports = {
  getCurrentMonthPayments,
  getStudentPaymentInfo,
  createPayment,
  updatePayment,
  deletePayment
};
