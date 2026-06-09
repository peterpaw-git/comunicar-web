/**
 * start-tunnel.js
 * Avvia un Cloudflare Quick Tunnel per esporre il backend (porta 3001)
 * e aggiorna automaticamente BACKEND_PUBLIC_URL nel file .env.
 *
 * Uso: node start-tunnel.js
 * Richiede: cloudflared installato (vedi https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
 */

const { spawn, execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ENV_FILE    = path.join(__dirname, 'backend', '.env');
const BACKEND_PORT = process.env.PORT || 3001;

// ── helpers ─────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`[tunnel] ${msg}`); }
function warn(msg) { console.warn(`[tunnel] ⚠  ${msg}`); }
function ok(msg)   { console.log(`[tunnel] ✓ ${msg}`); }

/** Read .env as key=value map */
function readEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .filter(l => l.includes('='))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

/** Write key=value map back to .env */
function writeEnv(map) {
  const content = Object.entries(map).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

/** Update a single key in .env (create if missing) */
function setEnvKey(key, value) {
  const map = readEnv();
  map[key] = value;
  writeEnv(map);
}

/** Remove a single key from .env */
function unsetEnvKey(key) {
  const map = readEnv();
  delete map[key];
  writeEnv(map);
}

// ── check cloudflared ────────────────────────────────────────────────────────

function checkCloudflared() {
  try {
    execSync('cloudflared --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

if (!checkCloudflared()) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  cloudflared non trovato!                                    ║
║                                                              ║
║  Scaricalo da:                                               ║
║  https://developers.cloudflare.com/cloudflare-one/           ║
║    connections/connect-networks/downloads/                   ║
║                                                              ║
║  Windows (scelta rapida):                                    ║
║    winget install --id Cloudflare.cloudflared                ║
║  oppure scarica cloudflared-windows-amd64.exe, rinominalo   ║
║  in cloudflared.exe e mettilo in C:\\Windows\\System32\\       ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

// ── start tunnel ─────────────────────────────────────────────────────────────

log(`Avvio Cloudflare Quick Tunnel → http://localhost:${BACKEND_PORT}`);
log('Attendo URL pubblico...\n');

const proc = spawn('cloudflared', [
  'tunnel', '--url', `http://localhost:${BACKEND_PORT}`,
  '--no-autoupdate',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let urlFound = false;

function handleOutput(data) {
  const text = data.toString();
  // cloudflared prints the URL in stderr with pattern: https://xxxx.trycloudflare.com
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !urlFound) {
    urlFound = true;
    const tunnelUrl = match[0];
    setEnvKey('BACKEND_PUBLIC_URL', tunnelUrl);
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✓ Tunnel attivo!                                            ║
║                                                              ║
║  URL pubblico: ${tunnelUrl.padEnd(46)}║
║                                                              ║
║  Le immagini allegate funzionano ora.                        ║
║  Lascia questa finestra aperta durante l'invio.              ║
║  Premi Ctrl+C per chiudere il tunnel.                        ║
╚══════════════════════════════════════════════════════════════╝
`);
  }
}

proc.stdout.on('data', handleOutput);
proc.stderr.on('data', handleOutput);

proc.on('error', err => {
  warn(`Errore avvio cloudflared: ${err.message}`);
  process.exit(1);
});

proc.on('close', code => {
  log('Tunnel chiuso.');
  unsetEnvKey('BACKEND_PUBLIC_URL');
  log('BACKEND_PUBLIC_URL rimosso da .env');
  process.exit(code ?? 0);
});

// Cleanup on Ctrl+C / process exit
function cleanup() {
  log('Chiusura tunnel...');
  unsetEnvKey('BACKEND_PUBLIC_URL');
  proc.kill();
}

process.on('SIGINT',  cleanup);
process.on('SIGTERM', cleanup);
process.on('exit',    () => unsetEnvKey('BACKEND_PUBLIC_URL'));
