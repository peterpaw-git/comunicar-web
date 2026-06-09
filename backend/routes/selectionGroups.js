const express = require('express');
const router = express.Router();
const { groups } = require('../db');

router.get('/', (req, res) => res.json(groups.all()));

router.post('/', (req, res) => {
  const { name, filter_json, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    res.json(groups.create(name, filter_json || {}, description));
  } catch (e) {
    if (e.message === 'UNIQUE_NAME') return res.status(409).json({ error: 'nome già esistente' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const { name, filter_json, description } = req.body;
  try {
    // filter_json=undefined keeps existing filter; pass null explicitly to keep it
    groups.update(req.params.id, name, filter_json !== undefined ? filter_json : null, description);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  groups.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
