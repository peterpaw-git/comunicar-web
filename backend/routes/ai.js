const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const { requireAuth } = require('../middleware/auth');

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(text) {
  return `Sei un assistente di comunicazione per il Colégio Montessori Rainha (scuola brasiliana).

Ricevi un testo scritto da un membro dello staff scolastico. Il tuo compito:

1. **Lingua**: Se il testo è in italiano → traducilo in portoghese brasiliano. Se è già in portoghese, mantienilo.
2. **Grammatica**: Correggi eventuali errori grammaticali, ortografici e di punteggiatura.
3. **Struttura**: Organizza in paragrafi leggibili separati da riga vuota.
4. **Emoji**: Aggiungi emoji appropriate all'inizio dei paragrafi o su punti chiave per rendere il messaggio più visivo (massimo 1–2 emoji per paragrafo, non esagerare).
5. **Tono**: Professionale ma cordiale, adatto alle comunicazioni scuola-famiglia.
6. **Contenuto**: Preserva TUTTE le informazioni originali. Non inventare nulla.

Rispondi ESCLUSIVAMENTE con il testo migliorato — nessuna spiegazione, nessun preambolo.

Testo originale:
---
${text}
---`;
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function callOpenAI(text, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(text) }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function callAnthropic(text, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',   // fast + cheap
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildPrompt(text) }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? '';
}

// ── GET /api/ai/status — tells the frontend whether AI is available ──────────
router.get('/status', requireAuth, (req, res) => {
  const openaiKey    = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = openaiKey ? 'openai' : anthropicKey ? 'anthropic' : null;
  res.json({ available: !!provider, provider });
});

// ── POST /api/ai/improve ──────────────────────────────────────────────────────
router.post('/improve', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Testo mancante' });

  const openaiKey    = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return res.status(503).json({
      error: 'AI non configurata. Aggiungi OPENAI_API_KEY o ANTHROPIC_API_KEY nel file .env del backend.',
      noKey: true,
    });
  }

  try {
    let improved;
    if (openaiKey) {
      improved = await callOpenAI(text, openaiKey);
    } else {
      improved = await callAnthropic(text, anthropicKey);
    }
    if (!improved) throw new Error('Risposta AI vuota');
    res.json({ improved });
  } catch (err) {
    console.error('[AI improve]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
