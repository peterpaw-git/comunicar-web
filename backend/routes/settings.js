const express = require('express');
const router  = express.Router();
const { readJSON, writeJSON } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const FILE     = 'settings';
const DEFAULTS = { inactivityTimeout: 30 }; // minutes; 0 = disabled

function getSettings() {
  return { ...DEFAULTS, ...readJSON(FILE, {}) };
}

// GET /api/settings — any authenticated user (frontend needs it on load)
router.get('/', requireAuth, (req, res) => {
  res.json(getSettings());
});

// PATCH /api/settings — admin only
router.patch('/', requireAuth, requireAdmin, (req, res) => {
  const current = getSettings();
  const { inactivityTimeout } = req.body;
  if (inactivityTimeout !== undefined) {
    const val = parseInt(inactivityTimeout, 10);
    if (isNaN(val) || val < 0 || val > 480)
      return res.status(400).json({ error: 'Valore non valido (0–480 minuti)' });
    current.inactivityTimeout = val;
  }
  writeJSON(FILE, current);
  res.json(current);
});

module.exports = router;
