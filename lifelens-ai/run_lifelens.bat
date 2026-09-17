@echo off
chcp 65001 >nul
title LifeLens.AI Launcher
echo =======================================================
echo Launching LifeLens.AI Career Growth Simulator...
echo =======================================================
echo.
cd /d "%~dp0backend"
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
start "LifeLens.AI Backend (Port 5000)" cmd /k "npm run dev"

cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "LifeLens.AI Frontend (Port 5173)" cmd /k "npm run dev"

timeout /t 3 >nul
start "" http://localhost:5173
echo Both Backend (Port 5000) and Frontend (Port 5173) started!
pause
