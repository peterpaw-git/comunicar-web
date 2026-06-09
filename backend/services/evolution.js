// Evolution GO (whatsmeow) — endpoints differ from standard Evolution API
// Auth: instance TOKEN as "apikey" header, no instance in URL path
// NOTE: /send/media accepts raw base64 in the "url" field — no public URL needed.
const fetch = require('node-fetch');

const BASE = () => process.env.EVOLUTION_URL?.replace(/\/$/, '');
const KEY  = () => process.env.EVOLUTION_APIKEY;

const headers = () => ({
  'Content-Type': 'application/json',
  apikey: KEY(),
});

async function sendText(number, text) {
  const url = `${BASE()}/send/text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number, text, delay: 1200 }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

// Evolution GO accepts raw base64 directly in the "url" field (no data: prefix needed).
// Tested: passing a base64 string gets decoded server-side and sent as media.
// Public URL is still supported as fallback if BACKEND_PUBLIC_URL is configured.
async function sendMedia(number, caption, mediaBase64, fileName, mimeType) {
  const type = mimeType?.startsWith('image') ? 'image'
             : mimeType?.includes('pdf')     ? 'document'
             : 'document';

  const url = `${BASE()}/send/media`;

  // Strategy 1: raw base64 in the url field (no public URL needed)
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      number,
      caption,
      type,
      url:      mediaBase64,   // raw base64 string — Evolution GO decodes it server-side
      filename: fileName,
      delay:    1200,
    }),
  });

  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function buildNumber(prefix, local) {
  if (!local) return null;
  const p = (prefix || '55').replace(/\D/g, '');
  const l = local.replace(/\D/g, '');
  return l ? `${p}${l}` : null;
}

async function checkStatus() {
  const res = await fetch(`${BASE()}/instance/status`, { headers: headers() });
  return res.json();
}

module.exports = { sendText, sendMedia, buildNumber, checkStatus };
