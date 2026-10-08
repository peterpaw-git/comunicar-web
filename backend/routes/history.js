const express = require('express');
const router = express.Router();
const { history } = require('../db');

router.get('/', (req, res) => {
  const { q = '', limit = 100 } = req.query;
  res.json(history.all({ q, limit: Number(limit) }));
});

router.get('/:id', (req, res) => {
  const entry = history.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'not found' });
  res.json(entry);
});

router.delete('/:id', (req, res) => {
  history.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
