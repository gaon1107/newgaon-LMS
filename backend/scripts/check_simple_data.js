const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSimpleData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lms_system',
      charset: 'utf8mb4'
    });

    console.log('✅ MySQL 연결 성공!\n');

    // 학생 데이터 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 학생 데이터 확인\n');
    const [students] = await connection.execute(
      'SELECT id, name, school, grade, phone, parent_phone, is_active FROM students'
    );
    
    console.log(`총 ${students.length}명의 학생이 DB에 등록되어 있습니다.\n`);
    students.forEach(s => {
      console.log(`  ${s.id}. ${s.name} (${s.school} ${s.grade}학년) - 활성: ${s.is_active ? 'O' : 'X'}`);
    });

    // 활성화된 학생만 확인
    const activeStudents = students.filter(s => s.is_active);
    console.log(`\n✅ 활성화된 학생: ${activeStudents.length}명`);

    // 강의 데이터 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 강의 데이터 확인\n');
    const [lectures] = await connection.execute(
      'SELECT id, name, subject_name, is_active FROM lectures'
    );
    
    console.log(`총 ${lectures.length}개의 강의가 DB에 등록되어 있습니다.\n`);
    lectures.forEach(l => {
      console.log(`  ${l.id}. ${l.name} (${l.subject_name}) - 활성: ${l.is_active ? 'O' : 'X'}`);
    });

    const activeLectures = lectures.filter(l => l.is_active);
    console.log(`\n✅ 활성화된 강의: ${activeLectures.length}개`);

    // 강사 데이터 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍🏫 강사 데이터 확인\n');
    const [instructors] = await connection.execute(
      'SELECT id, name, department, is_active FROM instructors'
    );
    
    console.log(`총 ${instructors.length}명의 강사가 DB에 등록되어 있습니다.\n`);
    instructors.forEach(i => {
      console.log(`  ${i.id}. ${i.name} (${i.department}) - 활성: ${i.is_active ? 'O' : 'X'}`);
    });

    const activeInstructors = instructors.filter(i => i.is_active);
    console.log(`\n✅ 활성화된 강사: ${activeInstructors.length}명`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSimpleData();
