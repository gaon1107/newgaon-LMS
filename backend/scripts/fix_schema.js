const mysql = require('mysql2/promise');

async function fixInstructorLecturesSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'gaon1107',
    database: 'lms_system',
    multipleStatements: true
  });

  try {
    console.log('🔧 데이터베이스 스키마 수정 시작...\n');

    // Step 1: 외래키 제약 조건 제거
    console.log('Step 1: 외래키 제약 조건 제거 중...');
    try {
      await connection.execute(
        'ALTER TABLE instructor_lectures DROP FOREIGN KEY instructor_lectures_ibfk_2'
      );
      console.log('✅ 외래키 제거 완료\n');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  외래키가 없거나 이미 제거됨\n');
      } else {
        throw error;
      }
    }

    // Step 2: lecture_id 컬럼 타입 변경
    console.log('Step 2: lecture_id 컬럼 타입 변경 중 (INT -> VARCHAR)...');
    await connection.execute(
      "ALTER TABLE instructor_lectures MODIFY lecture_id VARCHAR(50) NOT NULL COMMENT '강의 ID (문자열)'"
    );
    console.log('✅ lecture_id 타입 변경 완료 (VARCHAR)\n');

    // Step 3: 변경 확인
    console.log('Step 3: 변경 사항 확인...\n');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'instructor_lectures' AND COLUMN_NAME = 'lecture_id'"
    );
    
    console.log('📋 현재 instructor_lectures.lecture_id 정보:');
    console.log(columns[0]);
    console.log('\n');

    // Step 4: 전체 테이블 구조 확인
    console.log('📊 instructor_lectures 테이블 전체 구조:');
    const [tableInfo] = await connection.execute(
      'DESCRIBE instructor_lectures'
    );
    console.table(tableInfo);

    console.log('\n✅ 모든 수정 완료!');
    console.log('\n다음 단계:');
    console.log('1. 백엔드 재시작 (Ctrl+C → npm start)');
    console.log('2. 강사 페이지에서 강사 수정 테스트');
    console.log('3. 담당강의 선택 후 저장 → 성공! 🎉\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 정보:', error);
  } finally {
    await connection.end();
  }
}

// 실행
fixInstructorLecturesSchema();
