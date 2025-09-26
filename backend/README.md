# 학원관리 LMS 백엔드 서버

## 📋 프로젝트 개요
학원관리 LMS(Learning Management System)의 백엔드 API 서버입니다.

## 🛠️ 기술 스택
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Authentication**: JWT
- **ORM**: Native MySQL2

## 🚀 설치 및 실행

### 1. 환경 설정
```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 수정하여 데이터베이스 정보 입력
```

### 2. 데이터베이스 초기화
```bash
# 데이터베이스 스키마 생성
node config/initDatabase.js
```

### 3. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📁 프로젝트 구조
```
├── config/           # 설정 파일
├── controllers/      # 컨트롤러
├── middlewares/      # 미들웨어
├── models/          # 데이터 모델
├── routes/          # 라우터
├── services/        # 서비스 로직
├── utils/           # 유틸리티
├── uploads/         # 업로드 파일
├── logs/            # 로그 파일
└── server.js        # 메인 서버 파일
```

## 🔧 환경변수 설정
`.env` 파일에서 다음 변수들을 설정해주세요:

```env
# 서버 설정
NODE_ENV=development
PORT=5000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_system

# JWT 설정
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## 📊 데이터베이스 테이블
- users: 사용자(관리자) 정보
- students: 학생 정보
- teachers: 강사 정보
- lectures: 강의 정보
- student_lectures: 학생-강의 연결
- attendance_records: 출결 기록
- message_history: 메시지 발송 기록
- message_recipients: 메시지 수신자
- message_templates: 메시지 템플릿
- files: 파일 관리
- announcements: 공지사항
- system_logs: 시스템 로그

## 🔐 기본 계정
- **관리자**: admin / admin
- **슈퍼관리자**: newgaon / newgaon

## 📚 API 문서
서버 실행 후 다음 URL에서 확인 가능:
- Health Check: `GET /health`
- API Base: `/api`

## 🧪 테스트
```bash
npm test
```

## 📝 라이센스
MIT License