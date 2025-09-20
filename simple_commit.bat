@echo off
cd /d "%~dp0"
git add .
git commit -m "Update LMS system"
git push origin master
pause
