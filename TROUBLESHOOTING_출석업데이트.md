# 출석 상태 업데이트 오류 해결 가이드

## 문제 상황
프론트엔드에서 학생의 등원/하원 상태를 수기로 변경할 때 "출석 상태 업데이트 실패: 출결 상태 업데이트 중 오류가 발생했습니다" 오류가 발생

## 수정된 내용
1. ✅ 데이터베이스 스키마: `attendance.lecture_id`를 NULL 허용으로 변경 완료
2. ✅ 백엔드 API: `lectureId`를 선택적 파라미터로 변경 완료
3. ✅ 프론트엔드 코드: `lectureId` 전송 제거 완료

## 해결 방법

### 1단계: 프론트엔드 재시작 (가장 중요!)

프론트엔드 코드가 변경되었으므로 브라우저 캐시를 완전히 초기화해야 합니다.

```bash
# 프론트엔드 개발 서버가 실행 중이라면 먼저 중지 (Ctrl+C)

# 1. node_modules 및 빌드 캐시 정리
rm -rf node_modules/.vite
rm -rf dist

# 2. 프론트엔드 개발 서버 재시작
npm run dev
```

### 2단계: 브라우저 캐시 강제 새로고침

브라우저에서 다음 중 하나를 실행:
- **Windows/Linux**: `Ctrl + Shift + R` 또는 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

또는 브라우저 개발자 도구에서:
1. F12로 개발자 도구 열기
2. 네트워크 탭 열기
3. "캐시 비활성화" 체크박스 선택
4. 페이지 새로고침

### 3단계: 테스트

1. 학생 관리 페이지로 이동
2. 임의의 학생 선택
3. 상태를 "등원" 또는 "하원"으로 변경
4. 브라우저 콘솔(F12)에서 다음 로그 확인:

**기대되는 로그:**
```javascript
📝 출석 상태 업데이트 중... {
  studentId: 7,
  date: "2025-10-17",
  status: "present",
  type: "학원 출석 (강의 무관)"
}

========== 학원 출석 상태 업데이트 =========
🔍 [apiService] studentId: 7
🔍 [apiService] date: 2025-10-17
🔍 [apiService] attendanceData: {status: 'present', checkInTime: '14:30', checkOutTime: null, notes: ''}
========================================

✅ [apiService] 최종 전송 데이터 (lectureId 없음): {
  date: "2025-10-17",
  status: "present",
  notes: "",
  checkInTime: "14:30"
}
✅ [apiService] 요청 URL: /attendance/7

✅ 출석 상태 MySQL 저장 성공!
✅ 김준수의 상태를 등원로 변경하였습니다.
```

### 4단계: 백엔드 로그 확인

백엔드 콘솔에서 다음과 같은 로그가 출력되어야 합니다:

```
📝 [attendance PUT] 요청 수신: {
  studentId: '7',
  body: {
    date: '2025-10-17',
    status: 'present',
    notes: '',
    checkInTime: '14:30'
  },
  headers: '토큰 있음'
}
✅ [attendance PUT] 인증 통과, 사용자: newgaon
🎯 [attendance PUT] 핸들러 함수 실행 시작
🔍 [attendance PUT] validationResult 완료: 검증 통과
🔍 [attendance PUT] 처리 중: {
  studentId: '7',
  tenant_id: 'tenant_newgaon_1760407254406',
  date: '2025-10-17',
  lectureId: 'NULL (학원 출석)',
  status: 'present'
}
✅ 학원 출석 기록 (강의 없음)
➕ 새 기록 생성 (lectureId: NULL )
✅ 출결 상태 업데이트 성공!
```

## 여전히 오류가 발생한다면

### A. 프론트엔드 빌드 확인
```bash
# 프론트엔드 코드가 제대로 로드되는지 확인
# 브라우저 콘솔에서 다음 실행:
console.log(attendanceService.updateAttendanceStatus.toString())

# "lectureId"라는 단어가 보이면 안 됨!
```

### B. 백엔드 재시작
```bash
# 백엔드 서버 재시작
cd backend
# 기존 프로세스 종료 후
node server.js
```

### C. 데이터베이스 스키마 확인
```bash
cd backend
node -e "
const { db } = require('./config/database');
(async () => {
  try {
    const [result] = await db.execute(\`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attendance'
        AND COLUMN_NAME = 'lecture_id'
    \`);
    console.log('lecture_id 컬럼 정보:');
    console.table(result);

    if (result[0].IS_NULLABLE === 'YES') {
      console.log('✅ lecture_id가 NULL 허용 상태입니다!');
    } else {
      console.log('❌ lecture_id가 여전히 NOT NULL입니다. 스키마 업데이트 필요!');
    }
  } finally {
    process.exit(0);
  }
})();
"
```

### D. 특정 학생으로 테스트
```bash
cd backend
node -e "
const { db } = require('./config/database');
const axios = require('axios');

(async () => {
  try {
    // 1. 학생 목록 확인
    const [students] = await db.execute(
      'SELECT id, name, tenant_id FROM students LIMIT 5'
    );
    console.log('테스트 가능한 학생 목록:');
    console.table(students);

    // 2. 오늘 날짜의 출석 기록 확인
    const today = new Date().toISOString().split('T')[0];
    const [attendance] = await db.execute(
      'SELECT * FROM attendance WHERE date = ? AND lecture_id IS NULL',
      [today]
    );
    console.log(\`\\n오늘(\${today})의 학원 출석 기록:\`);
    console.table(attendance);

  } finally {
    process.exit(0);
  }
})();
"
```

## 문제가 계속되면

다음 정보를 함께 제공해주세요:

1. 브라우저 콘솔의 전체 로그 (F12 → Console 탭)
2. 백엔드 콘솔의 전체 로그
3. 네트워크 탭에서 `/api/attendance/{studentId}` PUT 요청의:
   - Request Headers
   - Request Payload
   - Response

이 정보를 통해 정확한 원인을 파악할 수 있습니다.
