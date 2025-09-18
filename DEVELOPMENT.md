# 가온출결시스템 리액트 버전 개발 가이드

## 프로젝트 개요
센차 ExtJS 기반의 기존 출결관리 시스템을 React + Material-UI로 포팅한 프로젝트입니다.

## 버전 정보
- **최신 버전**: v1.1.0 (2024-01-15)
- **커밋 해시**: 43c9482
- **주요 변경사항**: 센차 버전과 동일한 대시보드 구현 완료

## 기술 스택
- **Frontend**: React 18 + Vite
- **UI Framework**: Material-UI (MUI)
- **상태관리**: React Context API
- **라우팅**: React Router v6
- **HTTP 클라이언트**: Axios
- **쿠키 관리**: js-cookie

## 프로젝트 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── dashboard/      # 대시보드 관련 컴포넌트
│   │   ├── DashboardHeader.jsx    # 헤더 (사용자 정보, 통계)
│   │   ├── AttendanceView.jsx     # 출석 현황 뷰
│   │   └── RecentHistory.jsx      # 최근 출결 내역
│   └── Layout.jsx      # 메인 레이아웃 컴포넌트
├── contexts/           # React Context
│   └── AuthContext.jsx # 인증 컨텍스트
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.jsx    # 홈/로그인 페이지
│   └── DashboardPage.jsx # 대시보드 페이지
├── services/           # API 서비스
│   └── authService.js  # 인증 관련 API
└── main.jsx           # 앱 진입점
```

## 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
- 개발 서버: http://localhost:3000
- 백엔드 프록시: https://localhost:8443 (vite.config.js에서 설정)

### 3. 빌드
```bash
npm run build
```

## 주요 기능

### 1. 인증 시스템
- **데모 모드**: admin/admin 계정으로 백엔드 없이 테스트 가능
- **실제 API**: 백엔드 서버 연동 시 JWT 토큰 기반 인증
- **토큰 관리**: 쿠키 + localStorage 이중 저장
- **자동 갱신**: Refresh Token을 이용한 자동 토큰 갱신

### 2. 대시보드
센차 버전과 동일한 구조로 구현:

#### DashboardHeader
- 사용자 환영 메시지
- 학생 통계 (등원/총원생)
- SMS 잔액 정보
- 라이선스 잔여일 표시
- 실시간 시간/날짜

#### AttendanceView
- 학생 필터링 (모든 원생, 학원 내/외, 오늘 등원/미등원)
- 학생 카드 뷰 (프로필 사진, 이름, 출석 상태)
- 개별/단체 메시지 기능
- 반응형 그리드 레이아웃

#### RecentHistory
- 최근 출결 변경 내역 목록
- 자동 갱신 토글 기능
- 실시간 새로고침

### 3. 반응형 디자인
- 모바일/태블릿/데스크톱 대응
- Material-UI Grid 시스템 활용
- 화면 크기에 따른 컴포넌트 배치 조정

## 개발 시 주의사항

### 1. 백엔드 연동
```javascript
// vite.config.js에서 프록시 설정
server: {
  proxy: {
    '/api': {
      target: 'https://localhost:8443',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### 2. 데모 모드
백엔드 서버가 없을 때 데모 계정으로 테스트:
- ID: admin
- PW: admin

### 3. 상태 관리
- AuthContext를 통한 전역 사용자 상태 관리
- 컴포넌트별 로컬 상태는 useState 사용

### 4. API 호출
```javascript
// authService.js 참조
import { authService } from '../services/authService'

// 로그인
const result = await authService.login(credentials)

// 현재 사용자 정보
const user = await authService.getCurrentUser()
```

## 추가 개발이 필요한 기능

### 1. 출결 관리 페이지
- 일별/월별 출결 조회
- 출결 상태 수정
- 출결 통계

### 2. 학생 관리
- 학생 등록/수정/삭제
- 학생 정보 관리
- 프로필 사진 업로드

### 3. 메시지 시스템
- SMS 발송 기능
- 메시지 히스토리
- 템플릿 관리

### 4. 설정 관리
- 학원 정보 설정
- 사용자 권한 관리
- 시스템 설정

## 센차 버전과의 차이점

### 완료된 포팅
- ✅ 메인 레이아웃 구조
- ✅ 대시보드 헤더
- ✅ 출석 현황 뷰
- ✅ 최근 출결 내역
- ✅ 로그인 시스템

### 미완료 (추가 개발 필요)
- ❌ 출결 관리 상세 페이지
- ❌ 학생 관리 페이지
- ❌ 게시판 시스템
- ❌ 설정 관리 페이지
- ❌ 실시간 알림 시스템

## 디버깅 팁

### 1. 백엔드 연결 문제
```javascript
// 브라우저 개발자 도구에서 확인
// Network 탭에서 API 호출 상태 확인
// Console에서 에러 메시지 확인
```

### 2. 인증 문제
```javascript
// localStorage에서 토큰 확인
localStorage.getItem('accessToken')

// 쿠키에서 토큰 확인
document.cookie
```

### 3. 상태 관리 문제
```javascript
// React DevTools 사용
// AuthContext 상태 확인
```

## 배포 가이드

### 1. 프로덕션 빌드
```bash
npm run build
```

### 2. 환경 변수 설정
```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-server.com/api
```

### 3. 정적 파일 서빙
build 폴더의 파일들을 웹서버에 배포

## 연락처 및 문의
- 개발자: Claude Code Assistant
- 프로젝트 관리: Gaon
- GitHub: https://github.com/gaon1107/newgaon-LMS

---
*마지막 업데이트: 2024-01-15*