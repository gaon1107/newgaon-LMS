const fs = require('fs');
const path = require('path');

/**
 * 모든 Model 파일에서 tenant_id 필터링 누락 여부 검사
 */

const modelsDir = path.join(__dirname, '..', 'models');
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 tenant_id 필터링 검사');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const issues = [];

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  console.log(`\n📄 ${file}`);
  console.log('─'.repeat(50));

  // WHERE 절이 있는 SELECT 쿼리 찾기
  const queries = [];
  let inQuery = false;
  let currentQuery = '';
  let startLine = 0;

  lines.forEach((line, index) => {
    // SELECT 쿼리 시작
    if (line.includes('SELECT') && (line.includes('FROM students') ||
        line.includes('FROM instructors') ||
        line.includes('FROM lectures') ||
        line.includes('FROM attendance') ||
        line.includes('FROM payments'))) {
      inQuery = true;
      currentQuery = '';
      startLine = index + 1;
    }

    if (inQuery) {
      currentQuery += line + '\n';
    }

    // 쿼리 종료
    if (inQuery && (line.includes(';') || line.includes('`;'))) {
      queries.push({
        query: currentQuery,
        line: startLine
      });
      inQuery = false;
    }
  });

  // 각 쿼리 검사
  queries.forEach(({ query, line }) => {
    const hasWhere = query.includes('WHERE');
    const hasTenantId = query.includes('tenant_id');

    // SELECT 쿼리에 WHERE는 있지만 tenant_id가 없는 경우
    if (hasWhere && !hasTenantId) {
      // 함수명 추출
      const functionMatch = content.substring(
        Math.max(0, content.indexOf(query) - 500),
        content.indexOf(query)
      ).match(/static async (\w+)\(/);

      const functionName = functionMatch ? functionMatch[1] : '(알 수 없음)';

      console.log(`⚠️  ${functionName}() - 라인 ${line}`);
      console.log(`   WHERE 절이 있지만 tenant_id 필터링 없음`);

      issues.push({
        file,
        function: functionName,
        line,
        type: 'missing_tenant_filter'
      });
    }
  });

  if (queries.length === 0) {
    console.log('   쿼리 없음');
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 검사 결과');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (issues.length > 0) {
  console.log(`❌ ${issues.length}개의 보안 문제 발견!\n`);

  console.table(issues.map(i => ({
    파일: i.file,
    함수: i.function,
    라인: i.line,
    문제: 'tenant_id 필터링 누락'
  })));

  console.log('\n⚠️  이 함수들은 다른 학원 데이터에 접근할 수 있습니다!');
  console.log('   수정이 필요합니다.\n');

} else {
  console.log('✅ 모든 쿼리에 tenant_id 필터링이 적용되어 있습니다!\n');
}
