@echo off
chcp 65001 >nul
title NEXORA AI HTTPS Tunnel Launcher
echo =======================================================
echo 🔒 NEXORA AI HTTPS Tunnel Launcher
echo =======================================================
echo.

set FRONTEND_PORT=5173

echo Checking if NEXORA AI frontend is running on Port %FRONTEND_PORT%...
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', %FRONTEND_PORT%); write-host 'FRONTEND_ACTIVE' } catch { write-host 'FRONTEND_INACTIVE' }" > "%temp%\tunnel_check.txt" 2>&1

findstr /c:"FRONTEND_ACTIVE" "%temp%\tunnel_check.txt" >nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: NEXORA AI frontend is NOT running on Port %FRONTEND_PORT%!
    echo.
    echo Please start the application first using 'run_mobile_app.bat' or 'run_nexora.bat'.
    echo.
    if exist "%temp%\tunnel_check.txt" del "%temp%\tunnel_check.txt" >nul 2>&1
    pause
    exit /b 1
)

if exist "%temp%\tunnel_check.txt" del "%temp%\tunnel_check.txt" >nul 2>&1

echo.
echo ✅ Verified: Frontend is actively listening on Port %FRONTEND_PORT%!
echo.
echo.
echo =======================================================
echo 📱 MOBILE INSTALLATION INSTRUCTIONS (All Mobile Phones):
echo 1. Wait for Cloudflare Tunnel to generate your HTTPS link below.
echo 2. Copy the generated link (e.g. https://...trycloudflare.com)
echo 3. Open the link on your mobile phone (Safari for iPhone, Chrome for Android).
echo 4. Tap "Add to Home Screen" or "Install App" in your mobile browser menu!
echo =======================================================
echo.

call npx -y @cloudflare/cloudflared tunnel --url http://127.0.0.1:%FRONTEND_PORT%
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Cloudflare Tunnel exited or failed. Launching LocalTunnel fallback...
    call npx -y localtunnel --port %FRONTEND_PORT% --local-host 127.0.0.1
)
pause
