const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const { requireAuth } = require('../middleware/auth');

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildBasePrompt(text) {
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

function buildPremiumPrompt(text) {
  return `Sei un esperto di comunicazione digitale per il Colégio Montessori Rainha (scuola brasiliana).

Ricevi un testo e devi trasformarlo in un messaggio WhatsApp professionale, visivamente attraente e ad alto impatto.

REGOLE OBBLIGATORIE:

1. **Lingua**: Portoghese brasiliano impeccabile (traduci dall'italiano se necessario).

2. **Struttura visiva per WhatsApp**:
   - Apri con un emoji-titolo che cattura l'attenzione (es: 📣, 🎉, ⚠️, 📌, 🏫)
   - Segui con *testo in grassetto* per il tema principale (usa gli asterischi di WhatsApp)
   - Usa elenchi puntati con • per liste di elementi, date, requisiti
   - Separa le sezioni logiche con una riga vuota
   - Chiudi con una frase cordiale e un emoji appropriato

3. **Formattazione WhatsApp nativa**:
   - *grassetto* (asterischi) → per titoli di sezione e termini importanti
   - _corsivo_ (underscore) → per date, orari, nomi propri
   - Emoji come marcatori visivi di sezione (1 per sezione, non di più)

4. **Schema-tipo da seguire** (adatta al contenuto):
   [emoji] *TITOLO/TEMA PRINCIPALE*

   Frase di apertura cordiale e contestuale (1-2 righe).

   [emoji] *Informazioni principali:*
   • Punto 1
   • Punto 2
   • Punto 3

   [emoji] *Data/Orario* (se presente):
   _giorno, data, ora_

   [emoji] *Cosa fare* (se c'è un'azione richiesta):
   Istruzione chiara e diretta.

   Chiusura cordiale 🙏

5. **Tono**: Caldo, coinvolgente, diretto — come una scuola moderna che rispetta il tempo delle famiglie.

6. **Contenuto**: Preserva TUTTE le informazioni originali senza inventare nulla.

Rispondi ESCLUSIVAMENTE con il messaggio formattato — nessuna spiegazione, nessun preambolo.

Testo originale:
---
${text}
---`;
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function callOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
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

async function callAnthropic(prompt, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
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
  const { text, mode } = req.body;   // mode: 'base' | 'premium'  (default: 'base')
  if (!text?.trim()) return res.status(400).json({ error: 'Testo mancante' });

  const openaiKey    = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return res.status(503).json({
      error: 'AI non configurata. Aggiungi OPENAI_API_KEY o ANTHROPIC_API_KEY nel file .env del backend.',
      noKey: true,
    });
  }

  const prompt = mode === 'premium' ? buildPremiumPrompt(text) : buildBasePrompt(text);

  try {
    let improved;
    if (openaiKey) {
      improved = await callOpenAI(prompt, openaiKey);
    } else {
      improved = await callAnthropic(prompt, anthropicKey);
    }
    if (!improved) throw new Error('Risposta AI vuota');
    res.json({ improved });
  } catch (err) {
    console.error('[AI improve]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
