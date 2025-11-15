@echo off
chcp 65001 >nul
echo ============================================
echo    뉴가온 LMS 백엔드 서버 시작
echo ============================================
echo.

:: PM2로 시작 시도
pm2 --version >nul 2>&1
if %errorLevel% equ 0 (
    echo PM2로 서버를 시작합니다...
    pm2 start server.js --name lms-backend
    echo.
    echo 서버 상태:
    pm2 status
    echo.
    echo 서버가 실행 중입니다!
    echo.
    echo 관리 명령어:
    echo   - 상태 확인: pm2 status
    echo   - 로그 보기: pm2 logs lms-backend
    echo   - 재시작: pm2 restart lms-backend
    echo   - 중지: pm2 stop lms-backend
    echo.
) else (
    echo PM2가 설치되어 있지 않습니다.
    echo 개발 모드로 서버를 시작합니다...
    echo.
    npm run dev
)

pause
