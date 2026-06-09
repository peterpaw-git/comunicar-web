#!/usr/bin/env bash
# ============================================================
# setup-vps.sh — Prima installazione di Comunicar su VPS
# Eseguire come root (o utente con sudo)
# Uso: bash setup-vps.sh
# ============================================================
set -e

APP_DIR="/opt/comunicar"
REPO_URL=""   # <-- metti qui il tuo repo Git (es. https://github.com/tuo-user/comunicar-web.git)
BRANCH="main"

echo "=== [1/7] Aggiorna sistema e installa dipendenze ==="
apt-get update -qq
apt-get install -y -q git curl nginx

echo "=== [2/7] Installa Node.js 20 LTS ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -q nodejs
fi
node -v && npm -v

echo "=== [3/7] Installa PM2 globalmente ==="
npm install -g pm2

echo "=== [4/7] Clona il repository ==="
if [ -z "$REPO_URL" ]; then
  echo "ATTENZIONE: REPO_URL non impostato."
  echo "Modifica setup-vps.sh e inserisci l'URL del tuo repository Git."
  echo "Poi ri-esegui questo script, oppure clona manualmente:"
  echo "  git clone <URL> $APP_DIR"
  exit 1
fi

if [ -d "$APP_DIR/.git" ]; then
  echo "  Directory $APP_DIR già esistente — skip clone."
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git checkout "$BRANCH"

echo "=== [5/7] Installa dipendenze npm ==="
npm run install:all

echo "=== [6/7] Build frontend ==="
npm run build

echo "=== [7/7] Configura .env ==="
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
  echo ""
  echo "============================================================"
  echo "  IMPORTANTE: configura $APP_DIR/backend/.env"
  echo "  Prima di avviare l'app imposta almeno:"
  echo "    EVOLUTION_URL=http://localhost:8080"
  echo "    EVOLUTION_APIKEY=<token-istanza>"
  echo "    WEBHOOK_FORWARD_URL=https://brbvnqdgevgslrtblpkh.supabase.co/functions/v1/whatsapp-webhook"
  echo "============================================================"
else
  echo "  .env già esistente — skip."
fi

echo ""
echo "=== Configurazione Nginx (reverse proxy) ==="
cat > /etc/nginx/sites-available/comunicar << 'NGINX'
server {
    listen 80;
    server_name _;          # sostituisci con il tuo dominio se ne hai uno

    # Serve il frontend statico
    root /opt/comunicar/frontend/dist;
    index index.html;

    # Reverse proxy per le API backend
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        # SSE: disabilita buffering
        proxy_buffering    off;
        proxy_cache        off;
        proxy_read_timeout 86400s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/comunicar /etc/nginx/sites-enabled/comunicar
nginx -t && systemctl reload nginx

echo ""
echo "=== Crea cartella log ==="
mkdir -p "$APP_DIR/logs"

echo ""
echo "=== Avvia con PM2 ==="
echo "  Ricordati di impostare il .env prima di eseguire:"
echo "    cd $APP_DIR && pm2 start ecosystem.config.js --env production"
echo "    pm2 save && pm2 startup"
echo ""
echo "Setup completato! Ora:"
echo "  1. Modifica $APP_DIR/backend/.env"
echo "  2. cd $APP_DIR && pm2 start ecosystem.config.js --env production"
echo "  3. pm2 save && pm2 startup"
echo "  4. Configura il webhook Evolution GO su http://<IP-VPS>/api/whatsapp/webhook"
