@echo off
chcp 65001 >nul
title NEXORA AI HTTPS Tunnel Launcher
echo =======================================================
echo 🔒 LifeLens.AI HTTPS Tunnel Launcher
echo =======================================================
echo.

set FRONTEND_PORT=5173

echo Checking if LifeLens.AI frontend is running on Port %FRONTEND_PORT%...
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', %FRONTEND_PORT%); write-host 'FRONTEND_ACTIVE' } catch { write-host 'FRONTEND_INACTIVE' }" > "%temp%\tunnel_check.txt" 2>&1

findstr /c:"FRONTEND_ACTIVE" "%temp%\tunnel_check.txt" >nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: LifeLens.AI frontend is NOT running on Port %FRONTEND_PORT%!
    echo.
    echo Please start the application first using 'run_lifelens.bat'.
    echo.
    if exist "%temp%\tunnel_check.txt" del "%temp%\tunnel_check.txt" >nul 2>&1
    pause
    exit /b 1
)

if exist "%temp%\tunnel_check.txt" del "%temp%\tunnel_check.txt" >nul 2>&1

echo.
echo ✅ Verified: Frontend is actively listening on Port %FRONTEND_PORT%!
echo.
echo Launching HTTPS Tunnel for Port %FRONTEND_PORT%...
echo =======================================================
echo (Note: If loca.lt asks for a Tunnel Password, enter your
echo public IP address from: https://loca.lt/mytunnelpassword)
echo =======================================================
echo.

call npx -y localtunnel --port %FRONTEND_PORT% --local-host 127.0.0.1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ LocalTunnel exited or failed. Launching Cloudflare Tunnel fallback...
    call npx -y @cloudflare/cloudflared tunnel --url http://127.0.0.1:%FRONTEND_PORT%
)
pause
