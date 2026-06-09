const { parse: parseSync } = require('csv-parse/sync');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(name, def = []) {
  const p = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return def;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(name, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf8');
}

// ── simple auto-increment helper ──
function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(r => r.id)) + 1;
}

const clean = (v) => {
  if (!v || v === 'null' || v === '-' || String(v).trim() === '') return null;
  return String(v).replace(/\r\n|\r/g, '').trim();
};

const parseNum = (v) => {
  if (!v || v === 'null') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
};

function importCSV(filePath) {
  const raw = fs.readFileSync(filePath);
  const content = iconv.decode(raw, 'win1252');

  const records = parseSync(content, {
    delimiter: ';',
    columns: true,
    quote: '"',
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  let id = 1;
  const contacts = records.map(r => ({
    id: id++,
    id_prog:      parseNum(r.ID_PROG),
    attivo:       clean(r.ATTIVO),
    da_fare:      parseNum(r.DA_FARE) ? 1 : 0,
    fatto:        parseNum(r.FATTO) ? 1 : 0,
    responsabile: clean(r.RESPONSABILE),
    filhos:       clean(r.FILHOS),
    gruppo:       clean(r.GRUPPO),
    cpf:          clean(r.CPF),
    gruppo2:      clean(r.GRUPPO2),
    email_1:      clean(r.EMAIL_1),
    email_2:      clean(r.EMAIL_2),
    whats_mae:    clean(r.WHATS_MAE),
    whats_pai:    clean(r.WHATS_PAI),
    pref_int1:    clean(r.PREF_INT1) || '55',
    pref_int2:    clean(r.PREF_INT2) || '55',
    boleto:       clean(r.BOLETO),
    voti:         clean(r.VOTI),
    progressivo:  parseNum(r.PROGRESSIVO),
  }));

  writeJSON('contacts', contacts);
  return contacts.length;
}

// ── contacts ──
const contacts = {
  all: () => readJSON('contacts'),

  find: (ids) => {
    const all = readJSON('contacts');
    const set = new Set(ids.map(Number));
    return all.filter(c => set.has(c.id));
  },

  create: (data) => {
    const all = readJSON('contacts');
    const item = { id: nextId(all), ...data };
    all.push(item);
    writeJSON('contacts', all);
    return item;
  },

  update: (id, data) => {
    const all = readJSON('contacts');
    const idx = all.findIndex(c => c.id === Number(id));
    if (idx < 0) throw new Error('not found');
    all[idx] = { ...all[idx], ...data };
    writeJSON('contacts', all);
    return all[idx];
  },

  remove: (ids) => {
    const set = new Set(ids.map(Number));
    const all = readJSON('contacts').filter(c => !set.has(c.id));
    writeJSON('contacts', all);
    return ids.length;
  },

  patch: (ids, patch) => {
    const all = readJSON('contacts');
    const set = new Set(ids.map(Number));
    const updated = all.map(c => set.has(c.id) ? { ...c, ...patch } : c);
    writeJSON('contacts', updated);
  },
};

// ── selection groups ──
const groups = {
  all: () => readJSON('selection_groups'),

  create: (name, filter_json, description) => {
    const arr = readJSON('selection_groups');
    if (arr.find(g => g.name === name)) throw new Error('UNIQUE_NAME');
    const item = { id: nextId(arr), name, description: description ?? '', filter_json: JSON.stringify(filter_json), created_at: new Date().toISOString() };
    arr.push(item);
    writeJSON('selection_groups', arr);
    return item;
  },

  update: (id, name, filter_json, description) => {
    const arr = readJSON('selection_groups');
    const idx = arr.findIndex(g => g.id === Number(id));
    if (idx < 0) throw new Error('not found');
    // filter_json=null means keep existing
    arr[idx] = {
      ...arr[idx],
      name,
      description: description ?? arr[idx].description ?? '',
      ...(filter_json != null ? { filter_json: JSON.stringify(filter_json) } : {}),
    };
    writeJSON('selection_groups', arr);
  },

  remove: (id) => {
    const arr = readJSON('selection_groups').filter(g => g.id !== Number(id));
    writeJSON('selection_groups', arr);
  },
};

// ── templates ──
const templates = {
  all: () => readJSON('templates'),

  create: (data) => {
    const arr = readJSON('templates');
    const item = { id: nextId(arr), ...data, created_at: new Date().toISOString() };
    arr.unshift(item);
    writeJSON('templates', arr);
    return item;
  },

  remove: (id) => {
    writeJSON('templates', readJSON('templates').filter(t => t.id !== Number(id)));
  },
};

// ── message history ──
const history = {
  all: ({ q = '', limit = 100 } = {}) => {
    let arr = readJSON('history');
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(h =>
        (h.title && h.title.toLowerCase().includes(s)) ||
        (h.body  && h.body.toLowerCase().includes(s))
      );
    }
    return arr.slice(0, limit);
  },

  create: (data) => {
    const arr = readJSON('history');
    const item = { id: nextId(arr), ...data, sent_at: new Date().toISOString() };
    arr.unshift(item);
    if (arr.length > 500) arr.splice(500);
    writeJSON('history', arr);
    return item;
  },

  remove: (id) => {
    writeJSON('history', readJSON('history').filter(h => h.id !== Number(id)));
  },
};

// ── conversations ──
// Stored as { [jid]: { messages: [{ id, direction, text, timestamp, status, read, contactId, bulk }] } }
const conversations = {
  _read: () => readJSON('conversations', {}),

  getAll: () => {
    const all = readJSON('conversations', {});
    return Object.entries(all).map(([jid, conv]) => {
      const msgs = conv.messages ?? [];
      return { jid, messages: msgs };
    });
  },

  getMessages: (jid) => {
    const all = readJSON('conversations', {});
    return (all[jid]?.messages ?? [])
      .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
  },

  addMessage: (jid, msg) => {
    const all = readJSON('conversations', {});
    if (!all[jid]) all[jid] = { messages: [] };
    const message = {
      id:             crypto.randomUUID(),
      direction:      msg.direction ?? 'out',
      text:           msg.text ?? '',
      timestamp:      msg.timestamp ?? new Date().toISOString(),
      status:         msg.status ?? 'sent',
      read:           msg.direction === 'in' ? false : true,
      contactId:      msg.contactId ?? null,
      bulk:           msg.bulk ?? false,
      mediaType:      msg.mediaType ?? null,       // 'image'|'video'|'document'|'audio'|'sticker'
      whatsappMsgId:  msg.whatsappMsgId ?? null,   // original WA message ID for media download
      mediaFileName:  msg.mediaFileName ?? null,   // original filename (for documents)
      mediaMimetype:  msg.mediaMimetype ?? null,   // mimetype (for download headers)
    };
    all[jid].messages.push(message);
    // Keep last 500 messages per conversation
    if (all[jid].messages.length > 500) all[jid].messages = all[jid].messages.slice(-500);
    writeJSON('conversations', all);
    return message;
  },

  markRead: (jid) => {
    const all = readJSON('conversations', {});
    if (all[jid]) {
      all[jid].messages = all[jid].messages.map(m =>
        m.direction === 'in' && !m.read ? { ...m, read: true } : m
      );
      writeJSON('conversations', all);
    }
  },
};

module.exports = { contacts, groups, templates, history, conversations, importCSV, readJSON, writeJSON };
