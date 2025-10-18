-- students 테이블에 누락된 컬럼 추가
-- 실행 방법: MySQL에서 이 파일을 실행하거나, 명령어를 직접 실행

USE newgaon_lms;

-- send_payment_notification 컬럼 추가 (결제 알림 발송 여부)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS send_payment_notification BOOLEAN DEFAULT TRUE 
COMMENT '결제 안내 문자 발송 여부';

-- 컬럼이 제대로 추가되었는지 확인
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'newgaon_lms' 
  AND TABLE_NAME = 'students'
  AND COLUMN_NAME = 'send_payment_notification';

-- 완료 메시지
SELECT '✅ students 테이블 수정 완료!' AS result;
