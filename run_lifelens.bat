@echo off
chcp 65001 >nul
title NEXORA AI Launcher
echo =======================================================
echo Launching NEXORA AI Decision Simulator...
echo =======================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%lifelens-ai\backend"

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo Starting Backend Server on Port 5000...
start "NEXORA AI Backend (Port 5000)" cmd /k "cd /d ""%ROOT_DIR%lifelens-ai\backend"" && npm run dev"

cd /d "%ROOT_DIR%lifelens-ai\frontend"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting Frontend Server on Port 5173...
start "NEXORA AI Frontend (Port 5173)" cmd /k "cd /d ""%ROOT_DIR%lifelens-ai\frontend"" && npm run dev"

timeout /t 4 >nul
start "" "http://localhost:5173"
echo.
echo ✅ Both Backend (Port 5000) and Frontend (Port 5173) started!
echo You can open http://localhost:5173 in your browser.
pause
