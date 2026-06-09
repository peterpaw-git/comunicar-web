@echo off
title Comunicar - Installazione
chcp 65001 > nul

echo.
echo  ==========================================
echo   Comunicar Web App - Installazione
echo  ==========================================
echo.

:: --- Controlla Node.js ---
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRORE] Node.js non trovato!
    echo  Scaricalo da: https://nodejs.org  (versione LTS)
    echo  Poi riesegui questo script.
    pause
    exit /b 1
)
echo  [OK] Node.js trovato.

:: --- Installa dipendenze backend ---
echo.
echo  [1/4] Installo dipendenze backend...
cd /d %~dp0backend
call npm install --omit=dev
if %errorlevel% neq 0 ( echo  [ERRORE] npm install backend fallito. & pause & exit /b 1 )

:: --- Installa dipendenze frontend ---
echo.
echo  [2/4] Installo dipendenze frontend...
cd /d %~dp0frontend
call npm install
if %errorlevel% neq 0 ( echo  [ERRORE] npm install frontend fallito. & pause & exit /b 1 )

:: --- Configura .env ---
echo.
echo  [3/4] Configurazione credenziali...
cd /d %~dp0backend
if not exist .env (
    copy .env.example .env > nul
    echo.
    echo  *** IMPORTANTE ***
    echo  Apri il file: %~dp0backend\.env
    echo  e inserisci i valori corretti per EVOLUTION_URL e EVOLUTION_APIKEY
    echo  prima di avviare l'app.
    echo.
    start notepad %~dp0backend\.env
) else (
    echo  File .env gia' presente, lo tengo.
)

:: --- Installa PM2 e registra avvio automatico ---
echo.
echo  [4/4] Installo PM2 e registro avvio automatico...
cd /d %~dp0
call npm install -g pm2 pm2-windows-startup
call npx pm2-windows-startup install
call npx pm2 start ecosystem.config.js
call npx pm2 save

echo.
echo  ==========================================
echo   Installazione completata!
echo  ==========================================
echo.
echo  L'app si avviera' automaticamente ad ogni accensione.
echo  Per aprirla ora: esegui avvia.bat
echo.
pause
