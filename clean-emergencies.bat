@echo off
cd /d "%~dp0"
echo Clearing Emergency Database Tables...
node clean-emergencies.js
pause
