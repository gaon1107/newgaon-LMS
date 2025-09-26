const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/database');

// 메시지 발송
router.post('/send', [
  authenticateToken,
  authorizeRole(['admin', 'instructor']),
  body('title').notEmpty().withMessage('제목은 필수입니다').isLength({ max: 100 }).withMessage('제목은 100자 이내로 입력해주세요'),
  body('content').notEmpty().withMessage('내용은 필수입니다').isLength({ max: 1000 }).withMessage('내용은 1000자 이내로 입력해주세요'),
  body('type').isIn(['sms', 'email', 'push', 'all']).withMessage('유효한 메시지 타입을 선택해주세요'),
  body('recipients').isArray().withMessage('수신자 목록은 배열이어야 합니다'),
  body('recipients.*').isInt().withMessage('유효한 수신자 ID를 입력해주세요'),
  body('scheduled_at').optional().isISO8601().withMessage('유효한 날짜 형식을 입력해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { title, content, type, recipients, scheduled_at } = req.body;
    const senderId = req.user.id;

    // 수신자 유효성 검사
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_RECIPIENTS',
          message: '수신자를 선택해주세요'
        }
      });
    }

    // 수신자 존재 확인
    const recipientPlaceholders = recipients.map(() => '?').join(',');
    const [recipientCheck] = await db.execute(
      `SELECT id, name, phone, email FROM students WHERE id IN (${recipientPlaceholders})`,
      recipients
    );

    if (recipientCheck.length !== recipients.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RECIPIENTS',
          message: '일부 수신자를 찾을 수 없습니다'
        }
      });
    }

    // 메시지 비용 계산 (실제 SMS 서비스 연동 시 구현)
    const messageCost = calculateMessageCost(content, recipients.length, type);

    // 메시지 기록 저장
    const [messageResult] = await db.execute(`
      INSERT INTO messages (
        sender_id, title, content, type, recipient_count,
        total_cost, status, scheduled_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      senderId, title, content, type, recipients.length,
      messageCost, scheduled_at ? 'scheduled' : 'sent', scheduled_at
    ]);

    const messageId = messageResult.insertId;

    // 개별 수신자별 메시지 기록 저장
    const recipientValues = recipients.map(recipientId => [messageId, recipientId, 'pending']);
    const recipientPlaceholder = recipientValues.map(() => '(?, ?, ?)').join(',');

    await db.execute(`
      INSERT INTO message_recipients (message_id, recipient_id, delivery_status)
      VALUES ${recipientPlaceholder}
    `, recipientValues.flat());

    // 실제 메시지 발송 로직 (여기서는 시뮬레이션)
    if (!scheduled_at) {
      await sendMessage(messageId, type, title, content, recipientCheck);
    }

    res.json({
      success: true,
      data: {
        messageId,
        recipientCount: recipients.length,
        estimatedCost: messageCost,
        status: scheduled_at ? 'scheduled' : 'sent'
      },
      message: scheduled_at ? '메시지가 예약되었습니다' : '메시지가 발송되었습니다'
    });

  } catch (error) {
    console.error('메시지 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '메시지 발송 중 오류가 발생했습니다'
      }
    });
  }
});

// 메시지 발송 기록 조회
router.get('/history', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit은 1-100 사이여야 합니다'),
  query('type').optional().isIn(['sms', 'email', 'push', 'all']).withMessage('유효한 메시지 타입을 선택해주세요'),
  query('status').optional().isIn(['pending', 'sent', 'failed', 'scheduled']).withMessage('유효한 상태를 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    let messageQuery = `
      SELECT
        m.id,
        m.title,
        m.content,
        m.type,
        m.recipient_count,
        m.total_cost,
        m.status,
        m.scheduled_at,
        m.created_at,
        u.name as sender_name,
        (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id AND mr.delivery_status = 'delivered') as delivered_count,
        (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id AND mr.delivery_status = 'failed') as failed_count
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      WHERE 1=1
    `;

    const queryParams = [];

    if (type) {
      messageQuery += ' AND m.type = ?';
      countQuery += ' AND m.type = ?';
      queryParams.push(type);
    }

    if (status) {
      messageQuery += ' AND m.status = ?';
      countQuery += ' AND m.status = ?';
      queryParams.push(status);
    }

    messageQuery += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';

    const [messageResult] = await db.execute(messageQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await db.execute(countQuery, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        messages: messageResult,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('메시지 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '메시지 기록 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 메시지 비용 계산
router.post('/calculate-cost', [
  authenticateToken,
  body('content').notEmpty().withMessage('메시지 내용은 필수입니다'),
  body('recipientCount').isInt({ min: 1 }).withMessage('수신자 수는 1 이상이어야 합니다'),
  body('type').isIn(['sms', 'email', 'push', 'all']).withMessage('유효한 메시지 타입을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력 데이터가 올바르지 않습니다',
          details: errors.array()
        }
      });
    }

    const { content, recipientCount, type } = req.body;
    const cost = calculateMessageCost(content, recipientCount, type);

    res.json({
      success: true,
      data: {
        estimatedCost: cost,
        breakdown: {
          contentLength: content.length,
          recipientCount,
          type,
          pricePerMessage: getPricePerMessage(type),
          messageCount: Math.ceil(content.length / getMaxLength(type))
        }
      }
    });

  } catch (error) {
    console.error('비용 계산 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '비용 계산 중 오류가 발생했습니다'
      }
    });
  }
});

// 메시지 상세 조회
router.get('/:messageId', [
  authenticateToken,
  query('messageId').isInt().withMessage('유효한 메시지 ID를 입력해주세요')
], async (req, res) => {
  try {
    const { messageId } = req.params;

    const [messageResult] = await db.execute(`
      SELECT
        m.*,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);

    if (messageResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: '메시지를 찾을 수 없습니다'
        }
      });
    }

    const [recipientResult] = await db.execute(`
      SELECT
        mr.*,
        s.name as recipient_name,
        s.phone,
        s.email
      FROM message_recipients mr
      JOIN students s ON mr.recipient_id = s.id
      WHERE mr.message_id = ?
      ORDER BY s.name
    `, [messageId]);

    res.json({
      success: true,
      data: {
        message: messageResult[0],
        recipients: recipientResult
      }
    });

  } catch (error) {
    console.error('메시지 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '메시지 상세 조회 중 오류가 발생했습니다'
      }
    });
  }
});

// 헬퍼 함수들
function calculateMessageCost(content, recipientCount, type) {
  const pricePerMessage = getPricePerMessage(type);
  const maxLength = getMaxLength(type);
  const messageCount = Math.ceil(content.length / maxLength);

  return pricePerMessage * messageCount * recipientCount;
}

function getPricePerMessage(type) {
  const prices = {
    sms: 20,     // SMS: 20원
    email: 5,    // 이메일: 5원
    push: 2,     // 푸시: 2원
    all: 27      // 전체: SMS + 이메일 + 푸시
  };

  return prices[type] || 0;
}

function getMaxLength(type) {
  const lengths = {
    sms: 90,     // SMS: 90자 (한글 기준)
    email: 1000, // 이메일: 1000자
    push: 100,   // 푸시: 100자
    all: 90      // 전체: SMS 기준
  };

  return lengths[type] || 90;
}

// 실제 메시지 발송 함수 (시뮬레이션)
async function sendMessage(messageId, type, title, content, recipients) {
  try {
    // 실제 서비스에서는 SMS, 이메일, 푸시 서비스 API 호출

    const deliveryPromises = recipients.map(async (recipient) => {
      try {
        // SMS 발송 시뮬레이션
        if (type === 'sms' || type === 'all') {
          await simulateSMSSend(recipient.phone, content);
        }

        // 이메일 발송 시뮬레이션
        if (type === 'email' || type === 'all') {
          await simulateEmailSend(recipient.email, title, content);
        }

        // 푸시 발송 시뮬레이션
        if (type === 'push' || type === 'all') {
          await simulatePushSend(recipient.id, title, content);
        }

        // 발송 성공 업데이트
        await db.execute(`
          UPDATE message_recipients
          SET delivery_status = 'delivered', delivered_at = NOW()
          WHERE message_id = ? AND recipient_id = ?
        `, [messageId, recipient.id]);

      } catch (error) {
        console.error(`수신자 ${recipient.id} 메시지 발송 실패:`, error);

        // 발송 실패 업데이트
        await db.execute(`
          UPDATE message_recipients
          SET delivery_status = 'failed', error_message = ?
          WHERE message_id = ? AND recipient_id = ?
        `, [error.message, messageId, recipient.id]);
      }
    });

    await Promise.all(deliveryPromises);

    // 메시지 전체 상태 업데이트
    const [statusCheck] = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM message_recipients
      WHERE message_id = ?
    `, [messageId]);

    const { total, delivered, failed } = statusCheck[0];
    let finalStatus = 'sent';

    if (failed === total) {
      finalStatus = 'failed';
    } else if (delivered < total) {
      finalStatus = 'partial';
    }

    await db.execute(`
      UPDATE messages
      SET status = ?, sent_at = NOW()
      WHERE id = ?
    `, [finalStatus, messageId]);

  } catch (error) {
    console.error('메시지 발송 처리 오류:', error);

    await db.execute(`
      UPDATE messages
      SET status = 'failed'
      WHERE id = ?
    `, [messageId]);
  }
}

// 시뮬레이션 함수들
async function simulateSMSSend(phone, content) {
  // 실제 SMS API 연동 시 구현
  console.log(`SMS 발송 시뮬레이션: ${phone} - ${content}`);

  // 랜덤 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

  // 5% 확률로 실패 시뮬레이션
  if (Math.random() < 0.05) {
    throw new Error('SMS 발송 실패');
  }
}

async function simulateEmailSend(email, title, content) {
  // 실제 이메일 API 연동 시 구현
  console.log(`이메일 발송 시뮬레이션: ${email} - ${title}`);

  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

  if (Math.random() < 0.03) {
    throw new Error('이메일 발송 실패');
  }
}

async function simulatePushSend(userId, title, content) {
  // 실제 푸시 알림 API 연동 시 구현
  console.log(`푸시 발송 시뮬레이션: ${userId} - ${title}`);

  await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

  if (Math.random() < 0.02) {
    throw new Error('푸시 발송 실패');
  }
}

module.exports = router;