# 뉴가온 학원관리 LMS 시스템

학원관리를 위한 통합 LMS(Learning Management System) 프로젝트입니다. 프론트엔드(React)와 백엔드(Node.js)가 통합된 풀스택 프로젝트입니다.

## 🚀 시작하기

### 필요한 소프트웨어
- Node.js (v18 이상)
- MySQL 8.0 이상
- npm 또는 yarn

## 📋 프로젝트 구조

```
newgaon-LMS-master/
├── frontend/                 # React.js 프론트엔드 (기존 파일들)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── backend/                  # Node.js + Express + MySQL 백엔드
    ├── config/              # 데이터베이스 설정
    ├── controllers/         # 컨트롤러
    ├── middlewares/         # 미들웨어 (인증, 유효성 검증)
    ├── models/             # 데이터 모델
    ├── routes/             # API 라우터
    ├── services/           # 서비스 로직
    ├── utils/              # 유틸리티
    ├── uploads/            # 업로드 파일
    ├── server.js           # 메인 서버 파일
    └── package.json
```

### 프론트엔드 실행
```bash
# 루트 디렉토리에서
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 백엔드 실행
```bash
# backend 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보를 입력하세요

# 데이터베이스 초기화 (MySQL이 설치되어 있어야 함)
node config/createDatabase.js
node config/createTables.js
node config/insertInitialData.js

# 서버 실행
npm run dev  # 개발 모드 (포트 5000)
```

## 📁 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
│   └── Layout.jsx      # 메인 레이아웃
├── contexts/           # React Context
│   └── AuthContext.jsx # 인증 컨텍스트
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.jsx    # 홈페이지 (센차와 동일)
│   ├── DashboardPage.jsx # 대시보드
│   └── ...             # 기타 페이지들
├── services/           # API 서비스
│   └── authService.js  # 인증 관련 API
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx            # 엔트리 포인트
```

## 💾 데이터베이스 설정

### 기본 관리자 계정
- **admin** / **admin** (일반 관리자)
- **newgaon** / **newgaon** (슈퍼 관리자)

## 📚 백엔드 API 문서

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/user` - 현재 사용자 정보

### 학생 관리 API
- `GET /api/students` - 학생 목록 조회
- `GET /api/students/:id` - 학생 상세 조회
- `POST /api/students` - 학생 추가
- `PUT /api/students/:id` - 학생 정보 수정
- `DELETE /api/students/:id` - 학생 삭제

### 추가 구현 예정
- 강사 관리 API
- 강의 관리 API
- 출결 관리 API
- 메시지 발송 API
- 파일 관리 API
- 대시보드 API

## ✅ 개발 완료

### 프론트엔드
- [x] 홈페이지 구조
- [x] 로그인 시스템
- [x] 관리자 대시보드
- [x] 학생 관리 페이지
- [x] 강사 관리 페이지
- [x] 강의 관리 페이지
- [x] 출결 관리 페이지
- [x] 메시지 발송 페이지

### 백엔드
- [x] 프로젝트 초기 설정
- [x] MySQL 데이터베이스 연결
- [x] JWT 인증 시스템
- [x] 학생 관리 API (CRUD)

## 🛠️ 사용된 기술 스택

- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **React Router** - 클라이언트 사이드 라우팅
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트

## 🔗 API 연동

백엔드 API는 `https://localhost:8443/api`에서 실행되며, Vite의 프록시 설정을 통해 `/api`로 접근할 수 있습니다.

---

**개발자**: 가온 개발팀  
**마이그레이션**: Sencha ExtJS → React  
**완료일**: 2025년 1월
