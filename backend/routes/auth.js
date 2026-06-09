const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../db');
const { requireAuth, requireAdmin, SECRET } = require('../middleware/auth');

const USERS_FILE = 'users';

function getUsers() { return readJSON(USERS_FILE, []); }
function saveUsers(users) { writeJSON(USERS_FILE, users); }

// Seed default admin on first run — password is randomly generated, never hardcoded
function ensureDefaultAdmin() {
  const users = getUsers();
  if (users.length === 0) {
    // Generate a random 12-char password: letters + digits, easy to type
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const randPwd = Array.from(crypto.randomBytes(12))
      .map(b => chars[b % chars.length]).join('');
    const hash = bcrypt.hashSync(randPwd, 10);
    saveUsers([{
      id: 1,
      email: 'admin@comunicar.app',
      name: 'Supervisor',
      role: 'admin',
      password: hash,
      active: true,
      mustChangePassword: true,   // force password change on first login
    }]);
    console.log('');
    console.log('╔══════════════════════════════╗');
    console.log('║      PRIMEIRO ACESSO         ║');
    console.log('╠══════════════════════════════╣');
    console.log(`║  Email: admin@comunicar.app  ║`);
    console.log(`║  Senha: ${randPwd.padEnd(20)} ║`);
    console.log('║  (será pedido trocar a senha)║');
    console.log('╚══════════════════════════════╝');
    console.log('');
  }
}
ensureDefaultAdmin();

function safeUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, mustChangePassword: !!u.mustChangePassword };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha richiesti' });
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Email o password non corretti' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, SECRET(), { expiresIn: '10h' });
  res.json({ token, user: safeUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === req.user.id && u.active);
  if (!user) return res.status(401).json({ error: 'Utente non trovato' });
  res.json(safeUser(user));
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Password non valida (min 6 caratteri)' });
  const users = getUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utente non trovato' });
  if (!bcrypt.compareSync(currentPassword, users[idx].password))
    return res.status(401).json({ error: 'Password attuale non corretta' });
  users[idx].password = bcrypt.hashSync(newPassword, 10);
  users[idx].mustChangePassword = false;   // clear the forced-change flag
  saveUsers(users);
  res.json({ ok: true, user: safeUser(users[idx]) });
});

// ── Admin: user management ────────────────────────────────────────────────────

// GET /api/auth/users
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = getUsers().map(({ password: _, ...u }) => u);
  res.json(users);
});

// POST /api/auth/users
router.post('/users', requireAuth, requireAdmin, (req, res) => {
  const { email, name, role, password } = req.body;
  if (!email || !name || !role || !password) return res.status(400).json({ error: 'Campi richiesti: email, name, role, password' });
  if (!['admin', 'coordenadora', 'secretaria'].includes(role)) return res.status(400).json({ error: 'Ruolo non valido' });
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email già registrata' });
  const newUser = { id: (users.length ? Math.max(...users.map(u => u.id)) + 1 : 1), email, name, role, password: bcrypt.hashSync(password, 10), active: true, mustChangePassword: true };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...safe } = newUser;
  res.status(201).json(safe);
});

// PATCH /api/auth/users/:id
router.patch('/users/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Utente non trovato' });
  const { name, role, active, password } = req.body;
  if (name !== undefined)   users[idx].name   = name;
  if (role !== undefined)   users[idx].role   = role;
  if (active !== undefined) users[idx].active = active;
  if (password)             users[idx].password = bcrypt.hashSync(password, 10);
  saveUsers(users);
  const { password: _, ...safe } = users[idx];
  res.json(safe);
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Non puoi eliminare te stesso' });
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return res.status(404).json({ error: 'Utente non trovato' });
  saveUsers(filtered);
  res.json({ ok: true });
});

module.exports = router;
