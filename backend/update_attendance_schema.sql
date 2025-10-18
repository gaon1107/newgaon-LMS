-- attendance 테이블의 lecture_id를 NULL 허용으로 변경
ALTER TABLE attendance MODIFY COLUMN lecture_id INT NULL;

-- 기존 인덱스 확인 및 재생성 (필요시)
-- SHOW INDEX FROM attendance WHERE Column_name = 'lecture_id';
