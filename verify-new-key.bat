@echo off
cd /d "%~dp0"
echo Verifying Gemini API Key...
node verify-new-key.cjs
pause
