const Joi = require('joi');

// 학생 등록/수정 유효성 검증 스키마
const studentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': '이름은 문자열이어야 합니다.',
      'string.empty': '이름은 필수 입력 항목입니다.',
      'string.min': '이름은 최소 2자 이상이어야 합니다.',
      'string.max': '이름은 최대 100자 이하여야 합니다.',
      'any.required': '이름은 필수 입력 항목입니다.'
    }),

  school: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': '학교명은 최대 100자 이하여야 합니다.'
    }),

  grade: Joi.string()
    .max(10)
    .allow('', null)
    .messages({
      'string.max': '학년은 최대 10자 이하여야 합니다.'
    }),

  department: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': '학과/계열은 최대 50자 이하여야 합니다.'
    }),

  phone: Joi.string()
    .pattern(/^[0-9-+() ]*$/)
    .max(20)
    .allow('', null)
    .messages({
      'string.pattern.base': '올바른 전화번호 형식이 아닙니다.',
      'string.max': '전화번호는 최대 20자 이하여야 합니다.'
    }),

  parentPhone: Joi.string()
    .pattern(/^[0-9-+() ]*$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': '올바른 학부모 연락처 형식이 아닙니다.',
      'string.min': '학부모 연락처는 최소 10자 이상이어야 합니다.',
      'string.max': '학부모 연락처는 최대 20자 이하여야 합니다.',
      'any.required': '학부모 연락처는 필수 입력 항목입니다.'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .allow('', null)
    .messages({
      'string.email': '올바른 이메일 형식이 아닙니다.',
      'string.max': '이메일은 최대 255자 이하여야 합니다.'
    }),

  birthDate: Joi.date()
    .allow(null)
    .messages({
      'date.base': '올바른 생년월일 형식이 아닙니다.'
    }),

  address: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': '주소는 최대 1000자 이하여야 합니다.'
    }),

  notes: Joi.string()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': '비고사항은 최대 2000자 이하여야 합니다.'
    }),

  selectedClasses: Joi.array()
    .items(Joi.string())
    .default([])
    .messages({
      'array.base': '선택 강의는 배열이어야 합니다.'
    }),

  paymentDueDate: Joi.date()
    .allow(null)
    .messages({
      'date.base': '올바른 결제일 형식이 아닙니다.'
    }),

  sendPaymentNotification: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': '결제 알림 설정은 true 또는 false여야 합니다.'
    }),

  profileImage: Joi.string()
    .max(2000)
    .allow('', null)
    .messages({
      'string.max': '프로필 이미지 경로가 너무 깁니다.'
    }),

  autoMessages: Joi.object({
    attendance: Joi.boolean().default(true),
    outing: Joi.boolean().default(false),
    imagePost: Joi.boolean().default(false),
    studyMonitoring: Joi.boolean().default(false)
  }).default({
    attendance: true,
    outing: false,
    imagePost: false,
    studyMonitoring: false
  })
});

// 페이지네이션 스키마
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '페이지 번호는 숫자여야 합니다.',
      'number.integer': '페이지 번호는 정수여야 합니다.',
      'number.min': '페이지 번호는 1 이상이어야 합니다.'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': '페이지당 항목 수는 숫자여야 합니다.',
      'number.integer': '페이지당 항목 수는 정수여야 합니다.',
      'number.min': '페이지당 항목 수는 1 이상이어야 합니다.',
      'number.max': '페이지당 항목 수는 100 이하여야 합니다.'
    }),

  search: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': '검색어는 최대 100자 이하여야 합니다.'
    }),

  classId: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': '반 ID는 최대 50자 이하여야 합니다.'
    })
});

// 유효성 검증 미들웨어
const validateStudent = (req, res, next) => {
  const { error, value } = studentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const fields = {};
    error.details.forEach(detail => {
      const field = detail.path.join('.');
      if (!fields[field]) {
        fields[field] = [];
      }
      fields[field].push(detail.message);
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다.',
        fields
      }
    });
  }

  // 유효성 검증을 통과한 데이터로 교체
  req.body = value;
  next();
};

// 페이지네이션 유효성 검증 미들웨어
const validatePagination = (req, res, next) => {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const fields = {};
    error.details.forEach(detail => {
      const field = detail.path.join('.');
      if (!fields[field]) {
        fields[field] = [];
      }
      fields[field].push(detail.message);
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '쿼리 파라미터가 올바르지 않습니다.',
        fields
      }
    });
  }

  // 유효성 검증을 통과한 데이터로 교체
  req.query = value;
  next();
};

// ID 파라미터 유효성 검증 미들웨어
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (!id || id < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '유효하지 않은 ID입니다.'
      }
    });
  }

  req.params.id = id;
  next();
};

module.exports = {
  validateStudent,
  validatePagination,
  validateId
};