@echo off
echo =========================================
echo LMS 프로젝트 백업 도구
echo =========================================
echo.

REM 현재 날짜와 시간 가져오기
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"

REM 백업 폴더 이름 설정
set "backup_name=백업_%YY%_%MM%_%DD%_%HH%시%Min%분"

echo 백업을 시작합니다...
echo 백업 폴더명: %backup_name%
echo.

REM 백업 폴더 생성
mkdir "backups\%backup_name%" 2>nul

REM 주요 폴더 복사 (node_modules 제외)
echo src 폴더 백업 중...
xcopy /E /I /Y /Q "src" "backups\%backup_name%\src" >nul 2>&1

echo backend 폴더 백업 중...
xcopy /E /I /Y /Q "backend" "backups\%backup_name%\backend" >nul 2>&1

echo public 폴더 백업 중...
xcopy /E /I /Y /Q "public" "backups\%backup_name%\public" >nul 2>&1

REM 주요 파일 복사
echo 설정 파일 백업 중...
copy "package.json" "backups\%backup_name%\" >nul 2>&1
copy "vite.config.js" "backups\%backup_name%\" >nul 2>&1
copy "*.md" "backups\%backup_name%\" >nul 2>&1
copy "*.txt" "backups\%backup_name%\" >nul 2>&1

echo.
echo =========================================
echo 백업이 완료되었습니다!
echo 위치: backups\%backup_name%
echo =========================================
echo.

REM 백업 완료 후 메모 남기기
set /p memo="이번 백업의 메모를 남겨주세요 (예: 출석기능 추가 전): "
echo %YY%-%MM%-%DD% %HH%:%Min% - %memo% > "backups\%backup_name%\백업메모.txt"

echo 메모가 저장되었습니다.
echo.
pause
