require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { contacts, importCSV } = require('./db');
const { requireAuth, requireNotSecretaria } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ── Public routes (no auth) ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// Webhook from Evolution GO — must stay public (no Bearer header from Evolution)
app.post('/api/whatsapp/webhook', require('./routes/whatsapp').webhookHandler);

// ── Auth guard for everything else ────────────────────────────────────────────
app.use('/api', requireAuth);

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/contacts',         require('./routes/contacts'));
app.use('/api/selection-groups', require('./routes/selectionGroups'));
app.use('/api/templates',        require('./routes/templates'));
app.use('/api/send',             require('./routes/send'));
app.use('/api/history',          require('./routes/history'));
app.use('/api/whatsapp',         require('./routes/whatsapp').router);

// Status
app.get('/api/status', (req, res) => {
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
  res.json({
    mediaEnabled: !!(process.env.BACKEND_PUBLIC_URL),
    tunnelUrl:    process.env.BACKEND_PUBLIC_URL || null,
  });
});

const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Serve temp media files
const tmpDir = path.join(__dirname, 'uploads/tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
app.use('/tmp', express.static(tmpDir));

// Import CSV — blocked for secretaria
app.post('/api/import', requireNotSecretaria, upload.single('csv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
  try {
    const count = importCSV(req.file.path);
    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ imported: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV — blocked for secretaria
app.get('/api/export', requireNotSecretaria, (req, res) => {
  const all = contacts.all();
  const header = 'ID_PROG;ATTIVO;DA_FARE;FATTO;RESPONSABILE;FILHOS;GRUPPO;CPF;GRUPPO2;EMAIL_1;EMAIL_2;WHATS_MAE;WHATS_PAI;BOLETO;VOTI;PROGRESSIVO;PREF_INT1;PREF_INT2';
  const q = v => `"${v ?? ''}"`;
  const lines = all.map(r =>
    [r.id_prog, r.attivo, r.da_fare, r.fatto, r.responsabile, r.filhos, r.gruppo, r.cpf,
     r.gruppo2, r.email_1, r.email_2, r.whats_mae, r.whats_pai, r.boleto, r.voti,
     r.progressivo, r.pref_int1, r.pref_int2].map(q).join(';')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contatti.csv"');
  res.send('﻿' + [header, ...lines].join('\n'));
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(dist));
  app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Comunicar backend → http://localhost:${PORT}`);

  // Auto-import CSV on first launch if no contacts yet
  if (contacts.all().length === 0) {
    const candidates = [
      path.join(os.homedir(), 'Downloads', 'WHATSAPP.csv'),
      path.join(os.homedir(), 'OneDrive', 'Downloads', 'WHATSAPP.csv'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const n = importCSV(p);
          console.log(`Auto-importati ${n} contatti da ${p}`);
        } catch (e) {
          console.warn('Auto-import fallito:', e.message);
        }
        break;
      }
    }
  }
});
