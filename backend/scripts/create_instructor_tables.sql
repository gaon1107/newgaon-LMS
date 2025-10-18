-- 강사 관리 테이블 생성 스크립트
-- InstructorModel에 필요한 테이블 구조

USE lms_system;

-- 기존 instructors 테이블이 있다면 삭제 (주의: 데이터 손실!)
-- DROP TABLE IF EXISTS instructor_lectures;
-- DROP TABLE IF EXISTS instructors;

-- instructors 테이블 생성 (간단한 구조)
CREATE TABLE IF NOT EXISTS instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '강사 이름',
    department VARCHAR(100) COMMENT '학과/부서',
    subject VARCHAR(200) COMMENT '담당 과목 (쉼표로 구분)',
    phone VARCHAR(20) COMMENT '연락처',
    email VARCHAR(100) COMMENT '이메일',
    hire_date DATE COMMENT '입사일',
    address TEXT COMMENT '주소',
    notes TEXT COMMENT '비고',
    salary DECIMAL(10,2) DEFAULT 0 COMMENT '급여',
    employment_type ENUM('full-time', 'part-time', 'contract') DEFAULT 'full-time' COMMENT '고용 형태',
    status ENUM('active', 'inactive', 'resigned') DEFAULT 'active' COMMENT '상태',
    profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    INDEX idx_name (name),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강사 정보 테이블';

-- instructor_lectures 테이블 (강사-강의 연결 테이블)
CREATE TABLE IF NOT EXISTS instructor_lectures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL COMMENT '강사 ID',
    lecture_id INT NOT NULL COMMENT '강의 ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',

    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
    UNIQUE KEY unique_instructor_lecture (instructor_id, lecture_id),
    INDEX idx_instructor (instructor_id),
    INDEX idx_lecture (lecture_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강사-강의 연결 테이블';

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO instructors (name, department, subject, phone, email, hire_date, employment_type, status) VALUES
('박선생', '수학부', '수학, 물리', '010-1111-1111', 'park@example.com', '2020-03-01', 'full-time', 'active'),
('김선생', '영어부', '영어', '010-2222-2222', 'kim@example.com', '2019-09-01', 'full-time', 'active'),
('이선생', '과학부', '과학, 생물', '010-3333-3333', 'lee@example.com', '2021-05-15', 'part-time', 'active')
ON DUPLICATE KEY UPDATE name=name;

-- 테이블 생성 확인
SELECT 'instructors 테이블 생성 완료' AS status;
SELECT COUNT(*) AS instructor_count FROM instructors;

SELECT 'instructor_lectures 테이블 생성 완료' AS status;
SELECT COUNT(*) AS relation_count FROM instructor_lectures;
