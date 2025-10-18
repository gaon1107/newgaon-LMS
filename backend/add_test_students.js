const { pool } = require('./config/database');

async function addTestStudents() {
  try {
    console.log('=================================');
    console.log('테스트 학생 추가 스크립트');
    console.log('=================================\n');

    // 추가할 학생 목록
    const testStudents = [
      { name: '테스트학생1', attendanceNumber: '1234', parentPhone: '010-1111-1111', school: '가온 중학교', grade: '1학년' },
      { name: '김준수', attendanceNumber: '5678', parentPhone: '01011111111', school: '부천고', grade: '3학년' },
      { name: '이주은', attendanceNumber: '9012', parentPhone: '01099440180', school: '가은 중학교', grade: '2학년' },
      { name: '박성현', attendanceNumber: '3456', parentPhone: '010-6215-3980', school: '가은 중학교', grade: '3학년' },
      { name: '김영희', attendanceNumber: '7890', parentPhone: '010-2345-6789', school: '세가온중학교', grade: '1학년' },
      { name: '홍길동', attendanceNumber: '2345', parentPhone: '010-1234-5678', school: '세가온초등학교', grade: '3학년' },
      { name: '홍컬동', attendanceNumber: '6789', parentPhone: '010-9876-5432', school: '용현중학교', grade: '1학년' }
    ];

    console.log(`📝 추가할 학생: ${testStudents.length}명\n`);

    for (const student of testStudents) {
      // 중복 확인
      const [existing] = await pool.execute(
        'SELECT id, name FROM students WHERE attendance_number = ?',
        [student.attendanceNumber]
      );

      if (existing.length > 0) {
        console.log(`⚠️  건너뛰기: ${student.name} (${student.attendanceNumber}) - 이미 존재`);
        continue;
      }

      // 학생 추가
      const [result] = await pool.execute(`
        INSERT INTO students (
          name, 
          attendance_number, 
          parent_phone, 
          school, 
          grade, 
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [
        student.name,
        student.attendanceNumber,
        student.parentPhone,
        student.school,
        student.grade
      ]);

      console.log(`✅ 추가 완료: ${student.name} (${student.attendanceNumber}) - ID: ${result.insertId}`);
    }

    // 최종 결과 확인
    console.log('\n📊 최종 학생 목록:\n');
    const [allStudents] = await pool.execute(`
      SELECT id, name, attendance_number, school, grade, is_active
      FROM students
      WHERE is_active = 1
      ORDER BY id
    `);

    allStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. [${student.id}] ${student.name} (${student.attendance_number}) - ${student.school} ${student.grade}`);
    });

    console.log(`\n총 ${allStudents.length}명의 학생이 등록되어 있습니다.`);

    console.log('\n=================================');
    console.log('✅ 작업 완료!');
    console.log('=================================');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

addTestStudents();
