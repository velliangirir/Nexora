@echo off
chcp 65001 >nul
title NEXORA AI Mobile Launcher (All Phones)
echo =======================================================
echo 📱 NEXORA AI One-Click Mobile Launcher
echo =======================================================
echo.

set "ROOT_DIR=%~dp0"

echo Generating original NEXORA AI PWA mobile app icons...
node "%ROOT_DIR%lifelens-ai\frontend\setup_pwa_icons.js" >nul 2>&1

echo 1. Starting Backend (Port 5000)...
start "NEXORA AI Backend (Port 5000)" cmd /k "cd /d ""%ROOT_DIR%lifelens-ai\backend"" && npm run dev"

echo 2. Starting Frontend (Port 5173)...
start "NEXORA AI Frontend (Port 5173)" cmd /k "cd /d ""%ROOT_DIR%lifelens-ai\frontend"" && npm run dev"

echo.
echo Waiting 5 seconds for servers to start...
timeout /t 5 >nul

echo.
echo 3. Launching Secure HTTPS Tunnel for Mobile Access...
echo =======================================================
echo 🌐 Your phone link will appear below (https://...trycloudflare.com)
echo 📲 Open this link in Safari (iPhone) or Chrome (Android)
echo 📌 Tap "Add to Home Screen" or "Install App" to install on mobile!
echo =======================================================
echo.

call npx -y @cloudflare/cloudflared tunnel --url http://127.0.0.1:5173
pause
