-- ========================================
-- 학원 출석 시스템 DB 업데이트
-- ========================================
-- 목적: attendance 테이블의 lecture_id를 NULL 허용으로 변경
-- 이유: 학원 출석(등원/하원)은 특정 강의가 아닌 학원 전체에 대한 기록
--
-- 실행 방법:
-- 1. MySQL 클라이언트 접속: mysql -u root -p
-- 2. 데이터베이스 선택: USE your_database_name;
-- 3. 아래 SQL 실행
-- ========================================

-- 1. 현재 테이블 구조 확인
DESCRIBE attendance;

-- 2. lecture_id 컬럼을 NULL 허용으로 변경
ALTER TABLE attendance
MODIFY COLUMN lecture_id INT NULL
COMMENT '강의 ID (학원 출석은 NULL)';

-- 3. 외래키 제약조건 확인
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'attendance'
  AND COLUMN_NAME = 'lecture_id'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 4. 외래키가 있다면 삭제 후 재생성 (필요시 주석 해제)
-- ALTER TABLE attendance DROP FOREIGN KEY 외래키이름;
-- ALTER TABLE attendance
-- ADD CONSTRAINT fk_attendance_lecture
-- FOREIGN KEY (lecture_id)
-- REFERENCES lectures(id)
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;

-- 5. 변경 결과 확인
SELECT
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'attendance'
  AND COLUMN_NAME = 'lecture_id';

-- 6. 기존 데이터 확인 (lecture_id가 NULL인 레코드)
SELECT COUNT(*) as null_lecture_count
FROM attendance
WHERE lecture_id IS NULL;

-- ========================================
-- 완료!
-- 이제 학원 출석(등원/하원)을 lecture_id 없이 기록할 수 있습니다.
-- ========================================
