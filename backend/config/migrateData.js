const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터 마이그레이션
const migrateData = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('📋 데이터 마이그레이션 시작...');

    // 1. 기존 student_lectures 데이터 백업
    const [existingData] = await connection.query('SELECT * FROM student_lectures');
    console.log(`📊 기존 student_lectures 데이터 ${existingData.length}개 백업`);

    // 2. student_lectures 테이블 임시로 비우기
    await connection.query('DELETE FROM student_lectures');
    console.log('✅ student_lectures 데이터 임시 삭제');

    // 3. lecture_id 컬럼 타입 변경
    await connection.query('ALTER TABLE student_lectures MODIFY lecture_id BIGINT NOT NULL COMMENT "강의 ID"');
    console.log('✅ student_lectures.lecture_id 타입 변경 완료');

    // 4. 강의 데이터 생성 (기존 문자열 ID를 기반으로)
    const lectureMapping = {
      'math_a': { name: '수학 A반', subject: '수학', description: '수학 기초반' },
      'english_b': { name: '영어 B반', subject: '영어', description: '영어 기초반' }
    };

    const lectureIdMapping = {}; // 문자열 ID -> 숫자 ID 매핑

    for (const [oldId, lectureInfo] of Object.entries(lectureMapping)) {
      const [result] = await connection.query(`
        INSERT INTO lectures (name, subject, description, fee, max_students, current_students, status)
        VALUES (?, ?, ?, 200000, 15, 0, 'active')
      `, [lectureInfo.name, lectureInfo.subject, lectureInfo.description]);

      lectureIdMapping[oldId] = result.insertId;
      console.log(`✅ 강의 생성: ${oldId} -> ${result.insertId} (${lectureInfo.name})`);
    }

    // 5. 기존 데이터를 새로운 형식으로 복원
    for (const row of existingData) {
      const newLectureId = lectureIdMapping[row.lecture_id];
      if (newLectureId) {
        await connection.query(`
          INSERT INTO student_lectures (student_id, lecture_id, enrolled_at, is_active)
          VALUES (?, ?, ?, ?)
        `, [row.student_id, newLectureId, row.enrolled_at, row.is_active]);
        console.log(`✅ 데이터 복원: student ${row.student_id} -> lecture ${newLectureId}`);
      } else {
        console.log(`⚠️ 매핑되지 않은 강의 ID: ${row.lecture_id}`);
      }
    }

    // 6. 강의별 현재 수강생 수 업데이트
    await connection.query(`
      UPDATE lectures l
      SET current_students = (
        SELECT COUNT(*)
        FROM student_lectures sl
        WHERE sl.lecture_id = l.id AND sl.is_active = true
      )
    `);
    console.log('✅ 강의별 현재 수강생 수 업데이트 완료');

    // 7. 외래키 제약조건 다시 추가
    try {
      await connection.query('ALTER TABLE student_lectures ADD FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE');
      console.log('✅ student_lectures → lectures 외래키 추가');
    } catch (error) {
      console.log('⚠️ 외래키 추가 실패 (이미 존재할 수 있음):', error.message);
    }

    // 8. 샘플 강사 데이터 추가
    const sampleInstructors = [
      ['김영희', '수학과', '수학', '010-1234-5678', 'kim@example.com', '2023-01-01', '서울시 강남구', '수학 전문 강사', 3000000, 'full-time', 'active'],
      ['이철수', '영어과', '영어', '010-2345-6789', 'lee@example.com', '2023-02-01', '서울시 서초구', '영어 회화 전문', 2800000, 'full-time', 'active']
    ];

    for (const instructor of sampleInstructors) {
      try {
        await connection.query(`
          INSERT IGNORE INTO instructors (name, department, subject, phone, email, hire_date, address, notes, salary, employment_type, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, instructor);
      } catch (error) {
        console.log('⚠️ 강사 샘플 데이터 추가 실패:', error.message);
      }
    }
    console.log('✅ 샘플 강사 데이터 추가 완료');

    // 9. 강사-강의 관계 설정
    await connection.query(`
      CREATE TABLE IF NOT EXISTS instructor_lectures (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        instructor_id BIGINT NOT NULL COMMENT '강사 ID',
        lecture_id BIGINT NOT NULL COMMENT '강의 ID',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일시',
        is_active BOOLEAN DEFAULT TRUE COMMENT '배정 상태',

        INDEX idx_instructor (instructor_id),
        INDEX idx_lecture (lecture_id),
        INDEX idx_active (is_active),
        INDEX idx_assigned_at (assigned_at),
        UNIQUE KEY unique_assignment (instructor_id, lecture_id)
      ) COMMENT = '강사-강의 배정 관계 테이블'
    `);

    // 강사 배정 (1번 강사 -> 1번 강의, 2번 강사 -> 2번 강의)
    const assignments = [
      [1, 1], [2, 2]
    ];

    for (const assignment of assignments) {
      try {
        await connection.query(`
          INSERT IGNORE INTO instructor_lectures (instructor_id, lecture_id)
          VALUES (?, ?)
        `, assignment);

        await connection.query(`
          UPDATE lectures SET instructor_id = ? WHERE id = ?
        `, assignment);
      } catch (error) {
        console.log('⚠️ 강사-강의 관계 데이터 추가 실패:', error.message);
      }
    }
    console.log('✅ 강사-강의 관계 데이터 추가 완료');

    // 10. 외래키 제약조건 추가
    try {
      await connection.query('ALTER TABLE instructor_lectures ADD FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE');
      await connection.query('ALTER TABLE instructor_lectures ADD FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE');
      await connection.query('ALTER TABLE lectures ADD FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL');
      console.log('✅ 모든 외래키 제약조건 추가 완료');
    } catch (error) {
      console.log('⚠️ 외래키 추가 실패 (이미 존재할 수 있음):', error.message);
    }

    console.log('🎉 데이터 마이그레이션 완료!');

    // 최종 데이터 확인
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM student_lectures');
    const [lectureCount] = await connection.query('SELECT COUNT(*) as count FROM lectures');
    const [instructorCount] = await connection.query('SELECT COUNT(*) as count FROM instructors');

    console.log(`📊 최종 데이터 상황:`);
    console.log(`   - 학생-강의 관계: ${finalCount[0].count}개`);
    console.log(`   - 강의: ${lectureCount[0].count}개`);
    console.log(`   - 강사: ${instructorCount[0].count}개`);

    return true;

  } catch (error) {
    console.error('❌ 데이터 마이그레이션 실패:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 직접 실행 시
if (require.main === module) {
  migrateData()
    .then(success => {
      if (success) {
        console.log('✅ 데이터 마이그레이션 성공');
        process.exit(0);
      } else {
        console.log('❌ 데이터 마이그레이션 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('오류:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateData
};