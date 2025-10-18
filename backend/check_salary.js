/**
 * 강사 급여 확인 스크립트
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInstructorSalary() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'newgaon_lms'
    });
    
    console.log('🔍 강사 급여 확인 중...');
    console.log('');
    
    const [instructors] = await connection.execute(`
      SELECT id, name, salary, employment_type
      FROM instructors 
      WHERE is_active = true
      ORDER BY id
    `);
    
    console.log('📊 강사 급여 목록:');
    console.log('');
    
    instructors.forEach(instructor => {
      console.log(`ID: ${instructor.id}`);
      console.log(`이름: ${instructor.name}`);
      console.log(`급여: ${Number(instructor.salary).toLocaleString()}원`);
      console.log(`숫자로: ${instructor.salary}`);
      console.log(`고용형태: ${instructor.employment_type}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkInstructorSalary();
