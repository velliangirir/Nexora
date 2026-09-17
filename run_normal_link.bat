@echo off
chcp 65001 >nul
title NEXORA AI Normal Link Launcher
echo =======================================================
echo 📱 NEXORA AI Normal Mobile Install Link
echo =======================================================
echo.

node "%~dp0lifelens-ai\frontend\setup_pwa_icons.js" >nul 2>&1
node "%~dp0get_wifi_ip.js"

pause
