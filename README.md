# GFKids 출결관리 시스템 - React 버전

센차(Sencha ExtJS) 프레임워크로 개발된 GFKids 출결관리 시스템을 React로 마이그레이션한 프로젝트입니다.

## 🚀 시작하기

### 필요한 소프트웨어
- Node.js (v18 이상)
- npm 또는 yarn

### 설치 및 실행

1. 설치 스크립트 실행 (Windows)
```bash
install.bat
```

2. 또는 수동 설치
```bash
npm install
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 접속

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

## ✅ 완성된 기능

- [x] 센차와 똑같은 홈페이지 구조
- [x] 로그인 팝업 (센차와 동일)
- [x] 회원가입 페이지
- [x] 관리자 대시보드
- [x] 출결 관리 시스템
- [x] 학생 관리 시스템
- [x] 강사 관리 시스템
- [x] 강의 관리 시스템
- [x] 메시지 발송 시스템
- [x] 파일 업로드/다운로드

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
