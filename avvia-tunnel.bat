@echo off
title Comunicar - Tunnel immagini
chcp 65001 > nul

echo.
echo  ==========================================
echo   Comunicar - Tunnel per immagini WA
echo  ==========================================
echo.
echo  Questo script espone il backend su internet
echo  in modo che Evolution GO possa scaricare
echo  le immagini che allegate ai messaggi.
echo.
echo  Tienilo aperto durante gli invii con immagini.
echo  Chiudilo (Ctrl+C) quando hai finito.
echo.

cd /d %~dp0
node start-tunnel.js

pause
