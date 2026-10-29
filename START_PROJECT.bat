@echo off
title FitAI Pulse - AI Based Fitness Tracking System
color 0b
cd /d "%~dp0"

echo ===============================================================================
echo                FITAI PULSE - AI BASED FITNESS TRACKING SYSTEM                 
echo                     Full-Stack Machine Learning Web Application               
echo ===============================================================================
echo.
echo Demo Login: demo@fitai.com  ^|  Password: Demo@1234
echo URL:        http://127.0.0.1:5000
echo.
echo Starting server and opening web browser...
echo (Keep this black window OPEN while using the website)
echo ===============================================================================

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:5000"

if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" app.py
) else if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" app.py
) else (
    python app.py
)

echo.
echo Server stopped.
pause
