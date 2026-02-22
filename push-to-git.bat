@echo off
cd /d "%~dp0"

echo ===============================
echo   BISKATE - Git Push Script
echo ===============================
echo.

git status
echo.

echo Staging all changes...
git add .

echo.
set /p commit_msg="Enter commit message (or press Enter for timestamp): "
if "%commit_msg%"=="" (
    set commit_msg=Update %date% %time%
)

git commit -m "%commit_msg%"
echo.

echo Pushing to remote...
git push

echo.
echo ===============================
echo   Done!
echo ===============================
pause
