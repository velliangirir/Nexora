@echo off
chcp 65001 >nul
title NEXORA AI Wi-Fi Mobile Launcher
echo =======================================================
echo 📶 Setting up Wi-Fi Direct Mobile Access...
echo =======================================================
echo.

set FRONTEND_PORT=5173

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not found in system PATH.
    pause
    exit /b 1
)

node "%~dp0lifelens-ai\frontend\setup_pwa_icons.js" >nul 2>&1
node "%~dp0get_wifi_ip.js"

echo =======================================================
echo 💡 INSTRUCTIONS TO INSTALL WITH ORIGINAL LOGO VIA IP ADDRESS:
echo 1. If you previously saved a shortcut, remove/uninstall the old icon from your phone.
echo 2. Ensure your phone is connected to the SAME Wi-Fi network as this PC.
echo 3. Open Chrome (Android) or Safari (iPhone) and type the IP URL shown above.
echo 4. Tap browser menu (3 dots in Chrome / Share in Safari) -> "Add to Home screen" / "Install App".
echo 5. Your phone home screen will now display the crisp, original NEXORA AI logo!
echo =======================================================
echo.
pause
