#!/usr/bin/env bash
# ============================================================
# update.sh — Aggiorna Comunicar su VPS dal repository Git
# Eseguire come root o utente con sudo
# Uso: bash /opt/comunicar/scripts/update.sh
# ============================================================
set -e

APP_DIR="/opt/comunicar"
BRANCH="master"

cd "$APP_DIR"

echo "=== [1/4] Pull dal repository Git ==="
git fetch origin
git reset --hard "origin/$BRANCH"
echo "  Commit attuale: $(git log --oneline -1)"

echo ""
echo "=== [2/4] Aggiorna dipendenze npm (se cambiate) ==="
npm run install:all

echo ""
echo "=== [3/4] Build frontend ==="
npm run build

echo ""
echo "=== [4/4] Riavvia backend con PM2 ==="
pm2 restart comunicar --update-env
pm2 status comunicar

echo ""
echo "Aggiornamento completato!"
echo "Log in tempo reale: pm2 logs comunicar --lines 50"
