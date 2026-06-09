const express = require('express');
const router = express.Router();
const { contacts, conversations } = require('../db');
const { sendText, buildNumber } = require('../services/evolution');

// ── SSE clients for real-time push ───────────────────────────────────────────
const sseClients = new Set();
function pushToClients(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch (_) { sseClients.delete(res); }
  }
}

// ── Helper: build JID map from contacts ──────────────────────────────────────
function buildJidMap() {
  const all = contacts.all();
  const map = new Map(); // jid -> contact
  for (const c of all) {
    if (c.whats_mae) {
      const jid = buildNumber(c.pref_int1, c.whats_mae);
      if (jid) map.set(jid, c);
    }
    if (c.whats_pai) {
      const jid = buildNumber(c.pref_int2, c.whats_pai);
      if (jid) map.set(jid, { ...c, _label: 'Pai' });
    }
  }
  return map;
}

// GET /api/whatsapp/chats — list conversations enriched with contact info
router.get('/chats', (req, res) => {
  const jidMap = buildJidMap();
  const allConvs = conversations.getAll();

  const chats = allConvs.filter(({ jid }) => jid !== 'status').map(({ jid, messages }) => {
    const contact = jidMap.get(jid);
    const lastMsg = messages.length ? messages[messages.length - 1] : null;
    const unread = messages.filter(m => m.direction === 'in' && !m.read).length;
    return {
      jid,
      contactId:   contact?.id ?? null,
      contactName: contact?.responsabile ?? null,
      filhos:      contact?.filhos ?? null,
      label:       contact?._label ?? null,  // 'Pai' if matched via whats_pai
      lastMessage: lastMsg,
      unreadCount: unread,
    };
  }).sort((a, b) => {
    const ta = a.lastMessage?.timestamp ?? '0';
    const tb = b.lastMessage?.timestamp ?? '0';
    return tb < ta ? -1 : tb > ta ? 1 : 0;
  });

  res.json(chats);
});

// GET /api/whatsapp/contacts — all contacts with phone numbers (for new chat picker)
router.get('/contacts', (req, res) => {
  const all = contacts.all();
  const result = [];
  for (const c of all) {
    if (c.whats_mae) {
      const jid = buildNumber(c.pref_int1, c.whats_mae);
      if (jid) result.push({ jid, contactId: c.id, contactName: c.responsabile, filhos: c.filhos, label: 'Mãe' });
    }
    if (c.whats_pai) {
      const jid = buildNumber(c.pref_int2, c.whats_pai);
      if (jid) result.push({ jid, contactId: c.id, contactName: c.responsabile, filhos: c.filhos, label: 'Pai' });
    }
  }
  result.sort((a, b) => (a.contactName ?? '').localeCompare(b.contactName ?? ''));
  res.json(result);
});

// GET /api/whatsapp/messages/:jid
router.get('/messages/:jid', (req, res) => {
  const { jid } = req.params;
  conversations.markRead(jid);
  res.json(conversations.getMessages(jid));
});

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
  const { jid, text, contactId } = req.body;
  if (!jid || !text?.trim()) return res.status(400).json({ error: 'jid and text required' });

  let status = 'sent';
  let sendError = null;
  try {
    await sendText(jid, text.trim());
  } catch (err) {
    status = 'error';
    sendError = err.message;
  }

  const msg = conversations.addMessage(jid, {
    direction: 'out',
    text: text.trim(),
    status,
    contactId: contactId ?? null,
    error: sendError,
  });

  pushToClients({ type: 'message', jid, message: msg });

  if (status === 'error') return res.status(500).json({ error: sendError, message: msg });
  res.json({ ok: true, message: msg });
});

// POST /api/whatsapp/webhook — receives incoming messages from Evolution GO
// Also forwards to WEBHOOK_FORWARD_URL if configured (relay mode)
// NOTE: this handler is exported separately and mounted WITHOUT auth in server.js
function webhookHandler(req, res) {
  // Forward to original webhook (e.g. Supabase) if configured — fire and forget
  const forwardUrl = process.env.WEBHOOK_FORWARD_URL;
  if (forwardUrl) {
    const fetch = require('node-fetch');
    fetch(forwardUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    }).catch(e => console.warn('[webhook relay] forward error:', e.message));
  }

  try {
    const payload = req.body;
    const data = payload?.data ?? payload;

    // Evolution GO (whatsmeow) uses data.Info.Chat / data.Info.IsFromMe
    // Fallback to standard Evolution API format (data.key.remoteJid)
    const remoteJid = data?.Info?.Chat ?? data?.key?.remoteJid ?? data?.remoteJid ?? '';
    const fromMe    = data?.Info?.IsFromMe ?? data?.key?.fromMe ?? data?.fromMe ?? false;
    const jidClean = remoteJid.replace(/@.*$/, '');
    if (!remoteJid || jidClean === 'status') return res.sendStatus(200);

    // Extract text — Evolution GO uses data.Message (capital M)
    const msgObj = data?.Message ?? data?.message ?? {};
    const text = msgObj.conversation
      || msgObj.extendedTextMessage?.text
      || msgObj.imageMessage?.caption
      || msgObj.documentMessage?.caption
      || '[Media]';

    const jid = jidClean;
    const direction = fromMe ? 'out' : 'in';

    const message = conversations.addMessage(jid, {
      direction,
      text,
      read: direction === 'out', // outgoing = already read
    });

    pushToClients({ type: 'message', jid, message });
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.sendStatus(200); // always 200 to Evolution
  }
}
router.post('/webhook', webhookHandler);

// GET /api/whatsapp/events — SSE stream for real-time messages
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// Export router (protected, mounted under /api/whatsapp) and webhookHandler (public, mounted directly)
module.exports = { router, webhookHandler };
