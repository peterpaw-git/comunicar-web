// Evolution API v2 (Node.js) — instance name required in every URL path
// Auth: global apikey header; instance name from EVOLUTION_INSTANCE env var
const fetch = require('node-fetch');

const BASE      = () => process.env.EVOLUTION_URL?.replace(/\/$/, '');
const KEY       = () => process.env.EVOLUTION_APIKEY;
const INSTANCE  = () => process.env.EVOLUTION_INSTANCE || 'default';

const headers = () => ({
  'Content-Type': 'application/json',
  apikey: KEY(),
});

async function sendText(number, text) {
  const url = `${BASE()}/message/sendText/${INSTANCE()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number, text, delay: 1200 }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

// Evolution v2 accepts raw base64 in the "media" field.
async function sendMedia(number, caption, mediaBase64, fileName, mimeType) {
  const mediatype = mimeType?.startsWith('image') ? 'image'
                  : mimeType?.includes('pdf')     ? 'document'
                  : 'document';

  const url = `${BASE()}/message/sendMedia/${INSTANCE()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      number,
      caption,
      mediatype,
      mimetype: mimeType || 'application/octet-stream',
      media:    mediaBase64,
      fileName: fileName,
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
  const res = await fetch(`${BASE()}/instance/connectionState/${INSTANCE()}`, { headers: headers() });
  return res.json();
}

module.exports = { sendText, sendMedia, buildNumber, checkStatus };
