# 뉴가온 학원관리 LMS 시스템

학원 관리를 위한 종합 LMS(Learning Management System) 플랫폼입니다.

## 주요 기능

- 👥 **학생 관리**: 학생 정보, 출석, 수강료 관리
- 📚 **강의 관리**: 강의 등록, 수정, 삭제 및 수강생 관리
- 👨‍🏫 **강사 관리**: 강사 정보 및 급여 관리
- 📊 **대시보드**: 실시간 통계 및 현황 모니터링
- 📅 **출석 관리**: 일별/월별 출석 기록 및 통계
- 💬 **공지사항**: 학원 공지사항 관리

## 기술 스택

### Frontend
- React 18.2
- Material-UI (MUI) 5.14
- React Router 6
- Axios
- Vite

### Backend
- Node.js 18.x
- Express.js 4
- MySQL 8
- JWT 인증
- Bcrypt 암호화

## 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 9.x 이상
- MySQL 8.0 이상

### 설치 방법

1. **저장소 클론**
```bash
git clone https://github.com/gaon1107/newgaon-LMS.git
cd newgaon-LMS
```

2. **의존성 설치**

프론트엔드:
```bash
npm install
```

백엔드:
```bash
cd backend
npm install
cd ..
```

3. **환경 변수 설정**

`backend/.env.example` 파일을 복사하여 `backend/.env` 파일을 생성하고 환경 변수를 설정합니다:

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열어 다음 항목들을 수정합니다:
- `DB_PASSWORD`: MySQL 데이터베이스 비밀번호
- `JWT_SECRET`: JWT 인증 비밀 키
- `JWT_REFRESH_SECRET`: JWT 리프레시 토큰 비밀 키

4. **데이터베이스 설정**

MySQL에 접속하여 데이터베이스를 생성합니다:

```sql
CREATE DATABASE lms_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

백엔드 디렉토리에서 초기 데이터베이스 스크립트를 실행합니다:

```bash
cd backend
node scripts/init_mysql.js
```

### 실행 방법

개발 모드로 실행:

**터미널 1 - 백엔드 서버:**
```bash
cd backend
npm run dev
```

**터미널 2 - 프론트엔드 서버:**
```bash
npm run dev
```

프론트엔드: http://localhost:3000
백엔드 API: http://localhost:5000

### 기본 관리자 계정

- **아이디**: `admin`
- **비밀번호**: `admin123!`

또는

- **아이디**: `newgaon`
- **비밀번호**: `newgaon123!`

> ⚠️ **보안 주의**: 처음 로그인 후 반드시 비밀번호를 변경하세요!

## 프로젝트 구조

```
newgaon-LMS/
├── backend/              # 백엔드 서버
│   ├── config/          # 데이터베이스 설정
│   ├── controllers/     # 비즈니스 로직
│   ├── models/          # 데이터 모델
│   ├── routes/          # API 라우트
│   ├── middlewares/     # 인증, 검증 미들웨어
│   ├── scripts/         # 데이터베이스 초기화 스크립트
│   └── server.js        # 서버 진입점
├── src/                 # 프론트엔드 소스
│   ├── components/      # React 컴포넌트
│   ├── contexts/        # Context API
│   ├── pages/          # 페이지 컴포넌트
│   ├── services/       # API 서비스
│   └── App.jsx         # 앱 진입점
└── package.json        # 프론트엔드 의존성
```

## 빌드 및 배포

### 프론트엔드 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 백엔드 프로덕션 실행

```bash
cd backend
NODE_ENV=production npm start
```

## 문제 해결

### 포트 충돌
백엔드 포트(5000) 또는 프론트엔드 포트(3000)가 이미 사용 중인 경우:
- 백엔드: `backend/.env` 파일에서 `PORT` 변경
- 프론트엔드: `vite.config.js`에서 포트 설정 변경

### 데이터베이스 연결 실패
- MySQL 서버가 실행 중인지 확인
- `backend/.env` 파일의 데이터베이스 설정 확인
- 데이터베이스 사용자 권한 확인

### CORS 에러
`backend/.env` 파일의 `CLIENT_URL`이 프론트엔드 URL과 일치하는지 확인하세요.

## 라이선스

MIT License

## 문의

이슈나 문의사항은 GitHub Issues에 등록해주세요.
