const express = require('express');
const router = express.Router();
const { contacts } = require('../db');
const { requireNotSecretaria } = require('../middleware/auth');

router.get('/', (req, res) => {
  const { search = '', gruppo = '', attivo = '' } = req.query;
  let all = contacts.all();

  if (search.trim()) {
    const s = search.toLowerCase();
    all = all.filter(c =>
      [c.responsabile, c.filhos, c.whats_mae, c.whats_pai, c.email_1]
        .some(v => v && v.toLowerCase().includes(s))
    );
  }
  if (gruppo.trim()) {
    const gruppiSet = new Set(gruppo.split(',').map(g => g.trim()).filter(Boolean));
    all = all.filter(c => c.gruppo && gruppiSet.has(c.gruppo));
  }
  if (attivo.trim()) all = all.filter(c => c.attivo === attivo);

  all.sort((a, b) => (a.progressivo ?? 0) - (b.progressivo ?? 0));

  res.json({ total: all.length, data: all });
});

router.get('/groups', (req, res) => {
  const all = contacts.all();
  const set = [...new Set(all.map(c => c.gruppo).filter(Boolean))].sort();
  res.json(set);
});

router.patch('/:id', (req, res) => {
  const { da_fare, fatto } = req.body;
  const patch = {};
  if (da_fare !== undefined) patch.da_fare = da_fare ? 1 : 0;
  if (fatto   !== undefined) patch.fatto   = fatto   ? 1 : 0;
  contacts.patch([req.params.id], patch);
  res.json({ ok: true });
});

router.patch('/', (req, res) => {
  const { ids, da_fare, fatto } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const patch = {};
  if (da_fare !== undefined) patch.da_fare = da_fare ? 1 : 0;
  if (fatto   !== undefined) patch.fatto   = fatto   ? 1 : 0;
  contacts.patch(ids, patch);
  res.json({ ok: true, updated: ids.length });
});

// ── CRUD ──

const ALLOWED_FIELDS = [
  'attivo','da_fare','fatto','responsabile','filhos','gruppo','cpf',
  'gruppo2','email_1','email_2','whats_mae','whats_pai','pref_int1',
  'pref_int2','boleto','voti','progressivo','id_prog',
];

function pickFields(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (k in body) out[k] = body[k] ?? null;
  return out;
}

router.post('/', (req, res) => {
  try {
    const item = contacts.create(pickFields(req.body));
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const item = contacts.update(req.params.id, pickFields(req.body));
    res.json(item);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.delete('/', requireNotSecretaria, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const n = contacts.remove(ids);
  res.json({ ok: true, deleted: n });
});

router.delete('/:id', requireNotSecretaria, (req, res) => {
  contacts.remove([req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
