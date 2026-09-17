@echo off
chcp 65001 >nul
title AI Customer Support Agent Studio
echo =======================================================
echo Launching AI Customer Support Agent Web Server...
echo =======================================================
where python >nul 2>&1
if %errorlevel% equ 0 (
    python api_server.py
) else (
    py -3 api_server.py
)
pause
