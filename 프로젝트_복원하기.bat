@echo off
echo =========================================
echo LMS 프로젝트 복원 도구
echo =========================================
echo.
echo 주의: 현재 프로젝트가 백업 버전으로 덮어씌워집니다!
echo.

REM backups 폴더 확인
if not exist "backups" (
    echo 백업 폴더가 없습니다!
    pause
    exit
)

echo 사용 가능한 백업 목록:
echo ─────────────────────────────────
dir /B /AD "backups"
echo ─────────────────────────────────
echo.

set /p backup_folder="복원할 백업 폴더 이름을 입력하세요: "

REM 백업 폴더 존재 확인
if not exist "backups\%backup_folder%" (
    echo.
    echo 해당 백업 폴더를 찾을 수 없습니다!
    pause
    exit
)

echo.
echo 정말로 "%backup_folder%" 버전으로 복원하시겠습니까?
echo 현재 작업 내용이 모두 사라집니다!
echo.
set /p confirm="계속하려면 YES를 입력하세요: "

if /I not "%confirm%"=="YES" (
    echo.
    echo 복원이 취소되었습니다.
    pause
    exit
)

echo.
echo 복원을 시작합니다...
echo.

REM 현재 파일 삭제 (주의: 백업 폴더는 제외)
echo 기존 파일 정리 중...
if exist "src" rmdir /S /Q "src" 2>nul
if exist "backend" rmdir /S /Q "backend" 2>nul
if exist "public" rmdir /S /Q "public" 2>nul

REM 백업에서 복원
echo src 폴더 복원 중...
if exist "backups\%backup_folder%\src" xcopy /E /I /Y /Q "backups\%backup_folder%\src" "src" >nul 2>&1

echo backend 폴더 복원 중...
if exist "backups\%backup_folder%\backend" xcopy /E /I /Y /Q "backups\%backup_folder%\backend" "backend" >nul 2>&1

echo public 폴더 복원 중...
if exist "backups\%backup_folder%\public" xcopy /E /I /Y /Q "backups\%backup_folder%\public" "public" >nul 2>&1

echo 설정 파일 복원 중...
if exist "backups\%backup_folder%\package.json" copy /Y "backups\%backup_folder%\package.json" "." >nul 2>&1
if exist "backups\%backup_folder%\vite.config.js" copy /Y "backups\%backup_folder%\vite.config.js" "." >nul 2>&1

echo.
echo =========================================
echo 복원이 완료되었습니다!
echo 복원된 버전: %backup_folder%
echo =========================================
echo.

REM 백업 메모 확인
if exist "backups\%backup_folder%\백업메모.txt" (
    echo 백업 메모:
    type "backups\%backup_folder%\백업메모.txt"
    echo.
)

echo npm install을 실행하여 패키지를 다시 설치하는 것을 권장합니다.
echo.
pause
