---
name: LMS 오류방지 시스템
description: Use BEFORE modifying any code in this LMS project (students, instructors, classes, attendance, files, DB tables, API endpoints). Validates impact and prevents breaking other features. Required for ALL code changes in this multi-tenant academy management system.
---

# LMS 오류방지 시스템

## 목적
학원 관리 LMS에서 코드 수정 시 연쇄 오류를 방지합니다.
- 학생 등록 수정 → 강사/강의/출결 오류 방지
- 파일 삭제 → 로그인 안됨 등의 문제 방지

## 기술 스택 정보
- Backend: Node.js + Express.js, MySQL2 (Native, ORM 없음), JWT 인증
- Frontend: React (Vite) + TypeScript, Material-UI, React Router v6
- Database: MySQL 8.0, Multi-tenant (tenant_id 기반 데이터 분리)
- 앱: Flutter (Dart)
- 외부 연동: 문자(아이원), 결제(미정), 얼굴인식(가온)

## 언제 사용하나요?
다음 작업을 하기 **전에** 반드시 이 Skill을 적용하세요:
1. 데이터베이스 테이블 수정 (학생, 강사, 강의, 출석 등)
2. API 엔드포인트 수정 (backend/routes/, backend/controllers/)
3. 공통 함수 수정 (apiService.js, 공통 컴포넌트)
4. 파일/폴더 삭제
5. 외부 연동 수정 (결제, 문자, 얼굴인식)

---

## 📋 체크리스트 (수정 전 필수)

### 1단계: 영향도 파악
코드를 수정하기 전, 다음 질문에 답하세요:

#### Q1. 어떤 파일을 수정하나요?
- 파일 경로: _______________
- 수정 이유: _______________

#### Q2. 이 파일을 사용하는 다른 곳이 있나요?
**검색 방법:**
```
- backend 파일 수정 시: 
  → frontend의 apiService.js에서 해당 API 호출하는지 확인
  → 다른 controller에서 import하는지 확인

- frontend 파일 수정 시:
  → 다른 컴포넌트에서 import하는지 확인
  → 공통 함수인 경우 전체 검색 (Ctrl+Shift+F)

- DB 테이블 수정 시:
  → 해당 테이블을 사용하는 모든 SQL 쿼리 찾기
```

#### Q3. tenant_id가 필요한 기능인가요?
**학원별 데이터 분리가 필요한 경우 (99%가 해당):**
- ✅ 학생, 강사, 강의, 출석, 결제 → **tenant_id 필수**
- ✅ SQL 쿼리에 `WHERE tenant_id = ?` 반드시 포함
- ❌ 관리자 계정, 시스템 설정 → tenant_id 불필요

---

### 2단계: SQL 쿼리 안전성 검사

#### ✅ 필수 검증 항목
모든 SQL 쿼리는 다음을 만족해야 합니다:

**1. tenant_id 포함 여부**
```javascript
// ❌ 잘못된 예 (전체 학원 데이터 조회됨!)
SELECT * FROM students WHERE student_id = ?

// ✅ 올바른 예
SELECT * FROM students WHERE tenant_id = ? AND student_id = ?
```

**2. SQL Injection 방지 (? 플레이스홀더 사용)**
```javascript
// ❌ 절대 하면 안되는 방법
const query = `SELECT * FROM students WHERE name = '${name}'`;

// ✅ 올바른 방법
const query = 'SELECT * FROM students WHERE tenant_id = ? AND name = ?';
const [rows] = await db.query(query, [tenantId, name]);
```

**3. JOIN 사용 시 모든 테이블에 tenant_id 조건**
```javascript
// ❌ 잘못된 예 (강의 테이블에 tenant_id 누락)
SELECT s.*, c.class_name 
FROM students s 
JOIN classes c ON s.class_id = c.class_id
WHERE s.tenant_id = ?

// ✅ 올바른 예
SELECT s.*, c.class_name 
FROM students s 
JOIN classes c ON s.class_id = c.class_id
WHERE s.tenant_id = ? AND c.tenant_id = ?
```

---

### 3단계: API 응답 형식 통일

모든 API는 동일한 형식으로 응답해야 합니다.

#### 성공 응답
```javascript
res.json({
  success: true,
  data: { ... },
  message: '작업 성공'
});
```

#### 실패 응답
```javascript
res.status(400).json({
  success: false,
  error: '에러 메시지',
  details: '상세 정보 (선택사항)'
});
```

#### 확인 방법
- 새로운 API를 만들 때 위 형식 사용
- 기존 API 수정 시 형식 유지
- Frontend에서 `response.success` 체크

---

### 4단계: 파일 삭제 전 의존성 체크

파일이나 폴더를 삭제하기 전 필수 확인사항:

#### 삭제 가능 여부 판단
```
1. 전체 프로젝트에서 파일명 검색 (Ctrl+Shift+F)
   → import 구문이 있는가?
   
2. 해당 파일의 함수명 검색
   → 다른 곳에서 호출하는가?
   
3. backend 파일인 경우:
   → server.js에서 라우터로 등록되어 있는가?
   
4. frontend 파일인 경우:
   → 라우터(App.jsx)에 경로가 있는가?
```

#### 안전한 삭제 절차
```
Step 1: 파일 이름을 임시로 변경 (예: students.js → students.js.backup)
Step 2: 프로젝트 실행 및 전체 기능 테스트
Step 3: 오류 없으면 삭제, 오류 있으면 복구
```

---

### 5단계: 외부 연동 수정 시 체크

#### 문자 발송 (SMS - 아이원 네트웍스)
```javascript
// 필수 확인 사항
1. .env 파일에 SMS_API_KEY, SMS_API_SECRET 설정됨?
2. calculateMessageCost() 함수 구현됨?
3. sendMessage() 함수 구현됨?
4. 발송 실패 시 에러 처리됨?
5. tenant_id 포함하여 발송 내역 저장?
```

#### 결제 (PG - 미정)
```javascript
// 필수 확인 사항
1. payments 테이블 생성됨? (create_payments_table.js 실행)
2. PG사 API 키 설정됨?
3. tenant_id 포함된 결제 내역 저장?
4. 결제 실패/취소 처리 구현됨?
5. 보안: 결제 금액 서버에서 재검증?
```

#### 얼굴인식 (Flutter 앱 - 가온)
```javascript
// 필수 확인 사항
1. Face API Base URL 설정됨?
2. Client Token 발급됨?
3. Group ID와 tenant_id 매칭됨?
4. 얼굴 인식 실패 시 대체 출석 방법 제공?
```

---

## 🚨 수정 후 테스트 체크리스트

코드 수정 후 다음을 **반드시** 테스트하세요:

### 기본 기능 테스트
- [ ] 로그인 정상 작동
- [ ] 메인 대시보드 로딩
- [ ] 수정한 기능 정상 작동

### 연관 기능 테스트
학생 정보 수정한 경우:
- [ ] 강사 등록/수정/삭제
- [ ] 강의 등록/수정/삭제  
- [ ] 출석 체크
- [ ] 결제 내역 조회

강사 정보 수정한 경우:
- [ ] 학생 등록/수정/삭제
- [ ] 강의 배정
- [ ] 출석 관리

### Multi-tenant 테스트
- [ ] 다른 학원 데이터가 보이지 않는가?
- [ ] tenant_id가 다른 데이터 접근 시도 시 차단되는가?
- [ ] JWT 토큰에 올바른 tenant_id 포함되어 있는가?

---

## 💡 자주 발생하는 오류 패턴

### 패턴 1: tenant_id 누락
```javascript
// 문제 상황: 학생 수정 후 다른 학원 학생도 조회됨
// 원인: WHERE 절에 tenant_id 누락

// 해결:
WHERE tenant_id = ? AND student_id = ?
```

### 패턴 2: 공통 함수 수정으로 인한 연쇄 오류
```javascript
// 문제 상황: apiService.js 수정 후 여러 페이지 오류
// 원인: 함수 파라미터 변경했는데 호출하는 곳 미수정

// 해결: 
1. 함수명으로 전체 검색 (Ctrl+Shift+F)
2. 모든 호출 위치 수정
```

### 패턴 3: 파일 삭제로 인한 import 오류
```javascript
// 문제 상황: 불필요한 컴포넌트 삭제 후 앱 안 켜짐
// 원인: 다른 파일에서 해당 컴포넌트 import 중

// 해결:
1. 삭제 전 파일명 검색
2. import 구문 모두 제거 후 삭제
```

### 패턴 4: ORM 없이 Native MySQL2 사용 시 오류
```javascript
// 문제 상황: 쿼리 결과가 예상과 다름
// 원인: MySQL2 반환값 구조 이해 부족

// 해결:
const [rows] = await db.query(query, params);  // rows만 사용
// 또는
const [rows, fields] = await db.query(query, params);  // 필요시 fields도
```

---

## 🎯 올바른 수정 프로세스

```
1. 수정 전 영향도 파악 (1~3단계 체크리스트)
   ↓
2. 관련 파일 모두 찾기
   ↓
3. 수정 계획 수립 (어떤 파일을 어떻게 수정할지)
   ↓
4. Git으로 현재 상태 저장 (git add . && git commit)
   ↓
5. 수정 실행
   ↓
6. 테스트 (기본 기능 + 연관 기능)
   ↓
7. 문제 발견 시 Git으로 복구 (git reset --hard)
   ↓
8. 문제 없으면 완료
```

---

## 📞 Claude에게 도움 요청하는 방법

수정 전 Claude에게 이렇게 물어보세요:

```
"[파일명]을 수정하려고 하는데, 다른 곳에 영향 주는지 확인해줘"
"학생 테이블에 필드 추가하면 어디를 같이 수정해야 해?"
"이 파일 삭제해도 되는지 의존성 체크해줘"
"tenant_id 검증이 제대로 되어있는지 확인해줘"
```

Claude가 이 Skill을 참고해서 단계별로 검증해줍니다!

---

## 🔍 트러블슈팅 가이드

### 문제: "다른 학원 데이터가 보여요"
**원인:** tenant_id 조건 누락
**해결:**
1. 모든 SELECT 쿼리에 WHERE tenant_id = ? 추가
2. JOIN 시 모든 테이블에 tenant_id 조건 추가
3. JWT 토큰에서 tenant_id 제대로 추출되는지 확인

### 문제: "결제 모듈 연동했더니 문자가 안 가요"
**원인:** 트랜잭션 처리 누락 또는 순서 오류
**해결:**
1. 결제와 문자를 별도 트랜잭션으로 분리
2. 결제 성공 → 문자 발송 실패 시 롤백 정책 확인
3. 비동기 처리 순서 확인

### 문제: "파일 정리했더니 로그인 안 돼요"
**원인:** 인증 관련 파일 또는 의존성 삭제
**해결:**
1. Git으로 복구: git reset --hard HEAD~1
2. 삭제한 파일 목록 확인
3. middleware/auth.js, JWT 관련 파일 복구
