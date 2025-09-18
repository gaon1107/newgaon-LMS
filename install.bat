@echo off
chcp 65001 >nul

echo 🚀 GFKids 출결관리 시스템 React 버전 설치를 시작합니다...

REM 현재 디렉토리에 package.json이 있는지 확인
if not exist "package.json" (
    echo ❌ package.json 파일을 찾을 수 없습니다. 프로젝트 루트 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

REM Node.js 버전 확인
echo 📋 Node.js 버전을 확인합니다...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org에서 Node.js v18 이상을 다운로드하여 설치해주세요.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
echo ✅ Node.js 버전: %node_version%

REM npm 의존성 설치
echo 📦 npm 패키지를 설치합니다...
call npm install

if errorlevel 1 (
    echo ❌ npm 패키지 설치에 실패했습니다.
    echo    인터넷 연결을 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)

echo ✅ 패키지 설치 완료!

echo.
echo 🎉 설치가 완료되었습니다!
echo.
echo 📝 다음 명령어로 개발 서버를 시작할 수 있습니다:
echo    npm run dev
echo.
echo 🌐 브라우저에서 http://localhost:3000으로 접속하세요.
echo.

pause
