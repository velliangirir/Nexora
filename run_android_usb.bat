@echo off
chcp 65001 >nul
title NEXORA AI Android USB Launcher
echo =======================================================
echo 📱 Setting up Android USB Port Forwarding (ADB)...
echo =======================================================
echo.

where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: ADB (Android Debug Bridge) is not installed or not found in system PATH.
    echo 💡 Tip: You can use run_https_tunnel.bat instead to access NEXORA AI over WiFi/4G without USB cables!
    echo.
    pause
    exit /b 1
)

adb devices
echo.
echo Forwarding Android USB ports 5173 and 5000 to PC localhost...
adb reverse tcp:5173 tcp:5173
adb reverse tcp:5000 tcp:5000

echo.
echo =======================================================
echo ✅ ADB Port Forwarding Configured!
echo Now open Chrome on your Android phone and navigate to:
echo 👉 http://localhost:5173
echo =======================================================
echo.
pause
