-- SMS 충전 내역 테이블
CREATE TABLE IF NOT EXISTS sms_charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  amount INT NOT NULL COMMENT 'SMS 충전 건수',
  price INT NOT NULL COMMENT '충전 금액 (원)',
  payment_method VARCHAR(50) COMMENT '결제 방법',
  charged_by INT COMMENT '충전한 관리자 user_id',
  notes TEXT COMMENT '비고',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_created (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SMS 충전 내역';

-- SMS 사용 내역 테이블
CREATE TABLE IF NOT EXISTS sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  student_id INT COMMENT '학생 ID (등하원 문자의 경우)',
  phone_number VARCHAR(20) NOT NULL COMMENT '수신 번호',
  message TEXT NOT NULL COMMENT '발송 메시지 내용',
  message_type VARCHAR(50) DEFAULT 'attendance' COMMENT '메시지 유형 (attendance, payment, etc)',
  cost INT DEFAULT 1 COMMENT 'SMS 차감 건수',
  status VARCHAR(20) DEFAULT 'sent' COMMENT '발송 상태 (sent, failed)',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_tenant_sent (tenant_id, sent_at),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SMS 발송 내역';

-- 기존 학원의 SMS 잔액을 0으로 초기화
UPDATE tenants SET sms_balance = 0 WHERE sms_balance IS NULL OR sms_balance > 0;

-- 완료 메시지
SELECT 'SMS 테이블 생성 완료!' AS message;
