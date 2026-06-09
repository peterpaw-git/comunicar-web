const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'comunicar-dev-secret-change-in-prod';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  // Also accept ?token= query param for EventSource / SSE connections (which can't set headers)
  const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token || null;
  if (!token) return res.status(401).json({ error: 'Non autenticato' });
  try {
    req.user = jwt.verify(token, SECRET());
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Accesso negato' });
  next();
}

// Blocks the secretaria role (used for delete contacts, import, export)
function requireNotSecretaria(req, res, next) {
  if (req.user?.role === 'secretaria') return res.status(403).json({ error: 'Permesso negato per questo ruolo' });
  next();
}

module.exports = { requireAuth, requireAdmin, requireNotSecretaria, SECRET };
