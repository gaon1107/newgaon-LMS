@echo off
echo 🚀 자동 Git 커밋 시작...
echo.

echo 📁 현재 디렉토리로 이동
cd /d "%~dp0"

echo 🔍 변경된 파일 확인
git status

echo.
echo 📝 모든 변경사항 추가
git add .

echo.
echo 💾 커밋 생성
git commit -m "feat: 학원 관리 시스템 업데이트 - %date% %time%"

echo.
echo 🌐 GitHub에 푸시
git push origin master

echo.
echo ✅ 완료! GitHub을 확인해보세요.
echo.
pause
