@echo off
title FitAI Pulse - Cloudflare Public Link (Works on Any System)
color 0b

echo ===============================================================================
echo            FITAI PULSE - CLOUDFLARE SECURE LINK FOR ANY SYSTEM / PHONE
echo ===============================================================================
echo.
cd /d "%~dp0"

:: Start Flask server in separate minimized window if not already active
start "FitAI Server" /min cmd /c "python app.py"

echo Starting Cloudflare Secure Tunnel...
echo.
echo ===============================================================================
echo  LOOK BELOW FOR YOUR TRYCLOUDFLARE.COM LINK:
echo  (e.g., https://xxxxxx.trycloudflare.com)
echo.
echo  Copy and open that link on ANY device, phone, or laptop!
echo  (Keep this black window OPEN while you are using the link)
echo ===============================================================================
echo.

cloudflared.exe tunnel --url http://localhost:5000

pause
