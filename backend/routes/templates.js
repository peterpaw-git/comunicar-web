const express = require('express');
const router = express.Router();
const { templates } = require('../db');

router.get('/', (req, res) => res.json(templates.all()));

router.post('/', (req, res) => {
  const { name, title, body, type } = req.body;
  res.json(templates.create({ name, title, body, type: type || 'whatsapp' }));
});

router.delete('/:id', (req, res) => {
  templates.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
