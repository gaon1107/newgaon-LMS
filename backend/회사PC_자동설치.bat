@echo off
chcp 65001 >nul
echo ============================================
echo    뉴가온 LMS 백엔드 자동 설치 스크립트
echo ============================================
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한이 필요합니다.
    echo 이 파일을 우클릭 후 "관리자 권한으로 실행"을 선택해주세요.
    pause
    exit /b 1
)

echo [1/6] Node.js 확인 중...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 Node.js 18.x LTS를 다운로드하여 설치해주세요.
    pause
    exit /b 1
)
echo ✓ Node.js 설치 확인 완료
echo.

echo [2/6] MySQL 확인 중...
mysql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [경고] MySQL이 PATH에 없습니다.
    echo MySQL이 설치되어 있는지 확인해주세요.
    echo 계속하려면 아무 키나 누르세요...
    pause >nul
)
echo.

echo [3/6] 환경 설정 파일 생성 중...
if not exist .env (
    copy .env.example .env >nul
    echo ✓ .env 파일이 생성되었습니다.
    echo.
    echo [중요] .env 파일을 메모장으로 열어서 다음 항목을 수정해주세요:
    echo   - DB_PASSWORD=실제MySQL비밀번호
    echo.
    echo 수정 후 아무 키나 눌러주세요...
    pause >nul
) else (
    echo ✓ .env 파일이 이미 존재합니다.
)
echo.

echo [4/6] NPM 패키지 설치 중... (3-5분 소요)
call npm install
if %errorLevel% neq 0 (
    echo [오류] NPM 패키지 설치 실패
    pause
    exit /b 1
)
echo ✓ NPM 패키지 설치 완료
echo.

echo [5/6] 데이터베이스 초기화 중...
echo MySQL 비밀번호를 입력해야 할 수 있습니다.
node scripts\init_mysql.js
if %errorLevel% neq 0 (
    echo [경고] 데이터베이스 초기화 중 오류 발생
    echo 수동으로 MySQL에 접속하여 데이터베이스를 생성해주세요.
    echo.
    echo MySQL 명령:
    echo   CREATE DATABASE lms_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    echo.
    pause
)
echo.

echo [6/6] PM2 설치 중...
call npm install -g pm2
if %errorLevel% neq 0 (
    echo [경고] PM2 전역 설치 실패. 로컬 모드로 계속합니다.
)
echo.

echo ============================================
echo    설치가 완료되었습니다!
echo ============================================
echo.
echo 다음 명령어로 서버를 시작할 수 있습니다:
echo.
echo   pm2 start server.js --name lms-backend
echo   pm2 startup
echo   pm2 save
echo.
echo 또는 간단하게:
echo   npm run dev
echo.
echo 서버가 실행되면 브라우저에서 확인:
echo   http://localhost:5000/health
echo.
echo IP 주소 확인:
echo   ipconfig
echo.
pause
