@echo off
chcp 65001 >nul
title Installing NEXORA AI Dependencies
echo =======================================================
echo 📦 Installing Dependencies for NEXORA AI Application...
echo =======================================================
echo.

echo 1/2 Installing Backend dependencies...
cd /d "%~dp0lifelens-ai\backend"
call npm install

echo.
echo 2/2 Installing Frontend dependencies...
cd /d "%~dp0lifelens-ai\frontend"
call npm install

echo.
echo =======================================================
echo ✅ All dependencies installed successfully!
echo You can now double-click run_lifelens.bat to start the app.
echo =======================================================
pause
