@echo off
title Comunicar Web App

echo.
echo  ==========================================
echo   Comunicar Web App
echo  ==========================================
echo.

:: Controlla se PM2 ha i processi attivi
npx pm2 list 2>nul | findstr "online" >nul
if %errorlevel%==0 (
    echo  Server gia' in esecuzione in background.
) else (
    echo  Avvio server in background...
    cd /d %~dp0
    npx pm2 start ecosystem.config.js
    timeout /t 4 /nobreak > nul
)

echo.
echo  Apertura browser...
start http://localhost:5173

echo.
echo  Fatto! I server girano in background senza finestre aperte.
timeout /t 2 /nobreak > nul
