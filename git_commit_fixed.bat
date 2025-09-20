@echo off
chcp 65001 >nul
echo 🚀 자동 Git 커밋 시작...
echo.

echo 📁 현재 디렉토리로 이동 중...
cd /d "%~dp0"

echo.
echo 🔍 Git 상태 확인 중...
git status

echo.
echo 📝 모든 변경사항을 Git에 추가 중...
git add .

echo.
echo 💾 커밋을 생성 중...
git commit -m "Update: LMS system files updated"

echo.
echo 🌐 GitHub에 업로드 중...
git push origin master

echo.
echo ✅ 작업 완료! 
echo GitHub에서 확인해보세요: https://github.com/gaon1107/newgaon-LMS
echo.
echo 아무 키나 눌러서 종료하세요...
pause >nul
