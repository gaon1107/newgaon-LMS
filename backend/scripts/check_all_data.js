const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllData() {
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
    const [students] = await connection.execute('SELECT id, name, school, grade, phone, parent_phone FROM students WHERE is_active = true');
    console.log(`총 ${students.length}명의 학생이 등록되어 있습니다.\n`);
    if (students.length > 0) {
      students.forEach(s => {
        console.log(`  ${s.id}. ${s.name} (${s.school} ${s.grade}학년) - ${s.phone} / 학부모: ${s.parent_phone}`);
      });
    } else {
      console.log('  ⚠️ 등록된 학생이 없습니다!');
    }

    // 강의 데이터 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 강의 데이터 확인\n');
    const [lectures] = await connection.execute('SELECT id, name, subject_name, instructor_id, start_date FROM lectures WHERE is_active = true');
    console.log(`총 ${lectures.length}개의 강의가 등록되어 있습니다.\n`);
    if (lectures.length > 0) {
      lectures.forEach(l => {
        console.log(`  ${l.id}. ${l.name} (${l.subject_name})`);
      });
    } else {
      console.log('  ⚠️ 등록된 강의가 없습니다!');
    }

    // 강사 데이터 확인
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍🏫 강사 데이터 확인\n');
    const [instructors] = await connection.execute('SELECT id, name, department, phone FROM instructors WHERE is_active = true');
    console.log(`총 ${instructors.length}명의 강사가 등록되어 있습니다.\n`);
    if (instructors.length > 0) {
      instructors.forEach(i => {
        console.log(`  ${i.id}. ${i.name} (${i.department}) - ${i.phone}`);
      });
    } else {
      console.log('  ⚠️ 등록된 강사가 없습니다!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAllData();
