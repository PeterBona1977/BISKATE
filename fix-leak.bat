@echo off
cd /d "%~dp0"

echo ==============================================
echo   BISKATE - FIX LEAKED API KEY
echo ==============================================
echo.

echo 1. Removing test-key.cjs from git tracking...
git rm --cached test-key.cjs

echo.
echo 2. Staging changes (updated .gitignore and scrubbed file)...
git add .gitignore test-key.cjs

echo.
echo 3. Committing the fix...
git commit -m "Fix: Remove hardcoded leaked API key and update .gitignore"

echo.
echo 4. Pushing fixes to GitHub...
git push

echo.
echo ==============================================
echo   Done!
echo   IMPORTANT: Your old API key is permanently dead.
echo   You must create a NEW API key at:
echo   https://aistudio.google.com/app/apikey
echo   And update your .env.local file.
echo ==============================================
pause
