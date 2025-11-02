---
name: LMS 코드일관성 규칙
description: Use when writing or modifying ANY code in this LMS project. Enforces naming conventions (camelCase, tenant_id), file structure, API response formats, TypeScript types, and SQL query patterns for consistency across the entire codebase.
---

# LMS 코드일관성 규칙

## 목적
모든 개발자(또는 Claude)가 동일한 스타일로 코드를 작성하도록 규칙을 정합니다.
- 같은 기능은 같은 방식으로 작성
- 나중에 수정할 때 찾기 쉽게
- 오류 발생 가능성 최소화

## 언제 사용하나요?
새로운 코드를 작성하거나 기존 코드를 수정할 때 항상 이 규칙을 따르세요.

---

## 📁 파일 및 폴더 구조 규칙

### Backend 구조
```
backend/
├── server.js              # 메인 서버 파일 (라우터 등록만)
├── config/
│   └── database.js        # DB 연결 설정
├── middleware/
│   └── auth.js            # JWT 인증 미들웨어
├── routes/                # API 라우터 (URL 정의만)
│   ├── students.js
│   ├── instructors.js
│   ├── classes.js
│   ├── attendance.js
│   ├── payments.js
│   └── messages.js
├── controllers/           # 비즈니스 로직
│   ├── studentController.js
│   ├── instructorController.js
│   ├── classController.js
│   ├── attendanceController.js
│   ├── paymentController.js
│   └── messageController.js
├── models/                # DB 쿼리 함수
│   ├── studentModel.js
│   ├── instructorModel.js
│   ├── classModel.js
│   ├── attendanceModel.js
│   ├── paymentModel.js
│   └── messageModel.js
└── scripts/               # DB 마이그레이션 스크립트
    └── create_*_table.js
```

### Frontend 구조
```
src/
├── App.jsx               # 라우터 정의
├── services/
│   └── apiService.js     # 모든 API 호출 함수
├── pages/                # 페이지 컴포넌트
│   ├── dashboard/
│   ├── students/
│   ├── instructors/
│   ├── classes/
│   ├── attendance/
│   └── account/
├── components/           # 재사용 가능한 컴포넌트
│   ├── common/          # 공통 컴포넌트
│   └── layout/          # 레이아웃 컴포넌트
└── utils/               # 유틸리티 함수
```

### 파일명 규칙
- **Backend**: camelCase (studentController.js, paymentModel.js)
- **Frontend**: PascalCase for components (StudentList.jsx, PaymentPage.jsx)
- **Scripts**: snake_case (create_students_table.js)
- **Config**: camelCase (database.js, auth.js)

---

## 🏷️ 변수명 명명 규칙

### 일관된 용어 사용
학원 관리 시스템에서 사용하는 공식 용어:

| 한글 | 영어 (사용) | 사용 금지 |
|------|-------------|-----------|
| 학생 | student | pupil, learner |
| 강사 | instructor | teacher, tutor |
| 강의/수업 | class | course, lesson |
| 출석 | attendance | presence, checkin |
| 결제 | payment | billing, charge |
| 학원 | tenant | branch, academy |
| 메시지 | message | sms, notification |

### 변수명 규칙

#### JavaScript/TypeScript
```javascript
// ✅ 올바른 예
const studentId = 123;
const instructorName = "홍길동";
const tenantId = req.user.tenantId;
const classList = [];

// ❌ 잘못된 예
const student_id = 123;           // snake_case 금지
const InstructorName = "홍길동";  // PascalCase는 클래스/컴포넌트만
const tid = req.user.tenantId;    // 약어 금지
```

#### SQL 컬럼명
```sql
-- ✅ 올바른 예
student_id, instructor_name, tenant_id, created_at

-- ❌ 잘못된 예
studentId (camelCase 금지)
StudentID (PascalCase 금지)
```

#### Boolean 변수
```javascript
// ✅ 올바른 예
const isActive = true;
const hasPermission = false;
const canEdit = true;

// ❌ 잘못된 예
const active = true;          // is/has/can 없음
const permission = false;
```

#### 배열/리스트
```javascript
// ✅ 올바른 예
const students = [];          // 복수형
const instructorList = [];    // 또는 ~List
const classList = [];

// ❌ 잘못된 예
const student = [];           // 단수형 금지
const instructorArray = [];   // ~Array 지양
```

---

## 🔧 함수 작성 규칙

### 함수명 규칙
```javascript
// ✅ 올바른 예: 동사로 시작
const getStudents = () => {};
const createPayment = () => {};
const updateAttendance = () => {};
const deleteClass = () => {};
const calculateTotalFee = () => {};
const validateStudentData = () => {};

// ❌ 잘못된 예
const students = () => {};           // 동사 없음
const studentGet = () => {};         // 동사가 뒤에
```

### CRUD 함수 일관된 이름
모든 리소스는 동일한 패턴 사용:

```javascript
// Student 예시
getStudents()           // 목록 조회
getStudentById()        // 단일 조회
createStudent()         // 생성
updateStudent()         // 수정
deleteStudent()         // 삭제

// Instructor도 동일 패턴
getInstructors()
getInstructorById()
createInstructor()
updateInstructor()
deleteInstructor()

// Class도 동일 패턴
getClasses()
getClassById()
createClass()
updateClass()
deleteClass()
```

### 함수 파라미터 순서
```javascript
// ✅ 올바른 예: tenantId 항상 첫 번째
const getStudents = async (tenantId, filters) => {};
const createPayment = async (tenantId, paymentData) => {};

// ❌ 잘못된 예
const getStudents = async (filters, tenantId) => {};  // 순서 바뀜
```

---

## 📡 API 엔드포인트 규칙

### URL 구조
```javascript
// ✅ 올바른 예: RESTful 패턴
GET    /api/students              # 목록 조회
GET    /api/students/:id          # 단일 조회
POST   /api/students              # 생성
PUT    /api/students/:id          # 수정
DELETE /api/students/:id          # 삭제

// ❌ 잘못된 예
GET /api/getStudents              # 동사 포함 금지
POST /api/student/create          # create 불필요
GET /api/students/list            # list 불필요
```

### 응답 형식 통일

#### 성공 응답
```javascript
// 목록 조회
res.json({
  success: true,
  data: [...],
  total: 100,           // 전체 개수 (페이징 시 필요)
  message: '조회 성공'
});

// 단일 조회/생성/수정
res.json({
  success: true,
  data: { id: 1, name: '홍길동', ... },
  message: '작업 성공'
});

// 삭제
res.json({
  success: true,
  message: '삭제되었습니다'
});
```

#### 실패 응답
```javascript
// 400 Bad Request (잘못된 요청)
res.status(400).json({
  success: false,
  error: '필수 항목이 누락되었습니다',
  details: { field: 'student_name', message: 'required' }
});

// 401 Unauthorized (인증 실패)
res.status(401).json({
  success: false,
  error: '로그인이 필요합니다'
});

// 403 Forbidden (권한 없음)
res.status(403).json({
  success: false,
  error: '접근 권한이 없습니다'
});

// 404 Not Found
res.status(404).json({
  success: false,
  error: '데이터를 찾을 수 없습니다'
});

// 500 Internal Server Error
res.status(500).json({
  success: false,
  error: '서버 오류가 발생했습니다',
  details: process.env.NODE_ENV === 'development' ? error.message : undefined
});
```

---

## 🎯 TypeScript 타입 정의 규칙

### Interface vs Type
```typescript
// ✅ Interface 사용 (확장 가능한 객체)
interface Student {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}

// ✅ Type 사용 (union, 단순 타입)
type PaymentStatus = 'pending' | 'completed' | 'failed';
type StudentId = number;
```

### API 응답 타입
```typescript
// 공통 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

// 사용 예시
interface StudentListResponse extends ApiResponse<Student[]> {
  total: number;
}

interface StudentResponse extends ApiResponse<Student> {}
```

### Props 타입 정의
```typescript
// ✅ 올바른 예
interface StudentListProps {
  tenantId: number;
  onStudentSelect?: (student: Student) => void;
  showActions?: boolean;
}

const StudentList: React.FC<StudentListProps> = ({ 
  tenantId, 
  onStudentSelect, 
  showActions = true 
}) => {
  // ...
};
```

---

## 🗄️ MySQL 쿼리 작성 규칙

### 기본 규칙
```javascript
// ✅ 올바른 예: 플레이스홀더 사용
const query = `
  SELECT * FROM students 
  WHERE tenant_id = ? AND student_id = ?
`;
const [rows] = await db.query(query, [tenantId, studentId]);

// ❌ 잘못된 예: 문자열 연결 (SQL Injection 위험!)
const query = `SELECT * FROM students WHERE name = '${name}'`;
```

### INSERT 쿼리
```javascript
// ✅ 올바른 예
const query = `
  INSERT INTO students (tenant_id, name, email, phone, created_at)
  VALUES (?, ?, ?, ?, NOW())
`;
const [result] = await db.query(query, [tenantId, name, email, phone]);
const newStudentId = result.insertId;
```

### UPDATE 쿼리
```javascript
// ✅ 올바른 예: tenant_id 조건 필수
const query = `
  UPDATE students 
  SET name = ?, email = ?, phone = ?
  WHERE tenant_id = ? AND student_id = ?
`;
await db.query(query, [name, email, phone, tenantId, studentId]);
```

### DELETE 쿼리
```javascript
// ✅ 올바른 예: tenant_id 조건 필수
const query = `
  DELETE FROM students 
  WHERE tenant_id = ? AND student_id = ?
`;
await db.query(query, [tenantId, studentId]);
```

### JOIN 쿼리
```javascript
// ✅ 올바른 예: 모든 테이블에 tenant_id 조건
const query = `
  SELECT 
    s.student_id,
    s.name AS student_name,
    c.class_name,
    i.name AS instructor_name
  FROM students s
  JOIN classes c ON s.class_id = c.class_id AND c.tenant_id = ?
  JOIN instructors i ON c.instructor_id = i.instructor_id AND i.tenant_id = ?
  WHERE s.tenant_id = ?
`;
const [rows] = await db.query(query, [tenantId, tenantId, tenantId]);
```

### 트랜잭션
```javascript
// ✅ 올바른 예: 여러 작업을 묶어서 처리
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  
  // 1. 결제 생성
  await connection.query(
    'INSERT INTO payments (tenant_id, amount) VALUES (?, ?)',
    [tenantId, amount]
  );
  
  // 2. 학생 상태 업데이트
  await connection.query(
    'UPDATE students SET payment_status = ? WHERE tenant_id = ? AND student_id = ?',
    ['paid', tenantId, studentId]
  );
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 🎨 Frontend 컴포넌트 규칙

### 컴포넌트 구조
```jsx
// ✅ 올바른 예: 일관된 순서
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { getStudents } from '../../services/apiService';

interface StudentListProps {
  tenantId: number;
}

const StudentList: React.FC<StudentListProps> = ({ tenantId }) => {
  // 1. State 선언
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 2. Hooks
  const navigate = useNavigate();
  
  // 3. useEffect
  useEffect(() => {
    fetchStudents();
  }, [tenantId]);
  
  // 4. 함수 정의
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents(tenantId);
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 5. 렌더링
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};

export default StudentList;
```

### API 호출 (apiService.js)
```javascript
// ✅ 올바른 예: 모든 API 함수 여기에 정의
import axios from 'axios';

const API_BASE_URL = '/api';

// Students
export const getStudents = async (tenantId) => {
  const response = await axios.get(`${API_BASE_URL}/students`, {
    params: { tenantId }
  });
  return response.data;
};

export const createStudent = async (tenantId, studentData) => {
  const response = await axios.post(`${API_BASE_URL}/students`, {
    tenantId,
    ...studentData
  });
  return response.data;
};

// ❌ 잘못된 예: 컴포넌트 안에서 직접 axios 호출
const StudentList = () => {
  const fetchStudents = async () => {
    const response = await axios.get('/api/students');  // 금지!
  };
};
```

---

## 🔐 인증 및 권한 규칙

### JWT 토큰 사용
```javascript
// ✅ Backend: 토큰에서 tenantId 추출
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = {
    userId: decoded.userId,
    tenantId: decoded.tenantId,  // 필수!
    role: decoded.role
  };
  next();
};

// ✅ Frontend: 모든 요청에 토큰 포함
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📝 주석 작성 규칙

### 함수 주석
```javascript
/**
 * 학생 목록을 조회합니다
 * @param {number} tenantId - 학원 ID
 * @param {object} filters - 필터 조건 (선택)
 * @returns {Promise<Array>} 학생 목록
 */
const getStudents = async (tenantId, filters = {}) => {
  // ...
};
```

### 복잡한 로직 설명
```javascript
// ✅ 올바른 예: 왜 이렇게 했는지 설명
// Multi-tenant 환경에서 모든 쿼리에 tenant_id 조건 추가 필요
// 다른 학원 데이터 접근 방지
const query = `
  SELECT * FROM students 
  WHERE tenant_id = ? AND status = 'active'
`;

// ❌ 잘못된 예: 코드 그대로 반복
// students 테이블에서 조회
const query = `SELECT * FROM students`;
```

---

## 🚫 금지 사항

### 절대 하지 말아야 할 것들

1. **tenant_id 없이 쿼리 실행**
```javascript
// ❌ 절대 금지!
SELECT * FROM students WHERE student_id = ?
```

2. **SQL Injection 가능한 쿼리**
```javascript
// ❌ 절대 금지!
const query = `SELECT * FROM students WHERE name = '${name}'`;
```

3. **하드코딩된 값**
```javascript
// ❌ 금지
const tenantId = 1;  // 하드코딩
const apiKey = 'abc123';  // 하드코딩

// ✅ 올바른 예
const tenantId = req.user.tenantId;
const apiKey = process.env.API_KEY;
```

4. **console.log 프로덕션 배포**
```javascript
// ❌ 개발 중에만 사용, 배포 전 삭제
console.log('Student data:', student);

// ✅ 올바른 예: 필요시 로거 사용
// logger.info('Student created', { studentId: student.id });
```

---

## 📦 에러 처리 규칙

### try-catch 사용
```javascript
// ✅ 올바른 예
const createStudent = async (tenantId, studentData) => {
  try {
    const [result] = await db.query(
      'INSERT INTO students (tenant_id, name, email) VALUES (?, ?, ?)',
      [tenantId, studentData.name, studentData.email]
    );
    return { success: true, data: { id: result.insertId } };
  } catch (error) {
    console.error('Error creating student:', error);
    throw new Error('학생 등록에 실패했습니다');
  }
};
```

---

## 🎯 코드 리뷰 체크리스트

새로운 코드나 수정된 코드가 다음을 만족하는지 확인하세요:

- [ ] tenant_id가 필요한 곳에 모두 포함되었는가?
- [ ] SQL 쿼리에 플레이스홀더(?)를 사용했는가?
- [ ] 변수명이 규칙에 맞는가? (camelCase, 약어 금지)
- [ ] 함수명이 동사로 시작하는가?
- [ ] API 응답 형식이 통일되었는가? (success, data, error)
- [ ] TypeScript 타입이 정의되었는가?
- [ ] 에러 처리(try-catch)가 되어 있는가?
- [ ] 주석이 필요한 곳에 작성되었는가?
- [ ] console.log가 제거되었는가?
- [ ] 파일/폴더 구조가 규칙에 맞는가?
