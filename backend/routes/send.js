const express = require('express');
const router = express.Router();
const { contacts, history, conversations } = require('../db');
const { sendText, sendMedia, buildNumber } = require('../services/evolution');
const crypto = require('crypto');

const jobs = new Map();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendEmail(to, subject, text) {
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

async function runJob(jobId, contactList, message) {
  const { title, body, type, imageBase64, imageFileName, imageMime } = message;
  const fullText = title ? `*${title}*\n\n${body}` : body;
  const job = jobs.get(jobId);

  for (const c of contactList) {
    const targets = [];

    if (type === 'whatsapp') {
      if (c.whats_mae) targets.push({ num: buildNumber(c.pref_int1, c.whats_mae), label: 'WA Mãe' });
      if (c.whats_pai) targets.push({ num: buildNumber(c.pref_int2, c.whats_pai), label: 'WA Pai' });
    } else {
      if (c.email_1 && c.email_1 !== '-') targets.push({ num: c.email_1, label: 'Email' });
      if (c.email_2 && c.email_2 !== '-') targets.push({ num: c.email_2, label: 'Email 2' });
    }

    for (const t of targets) {
      if (!t.num) continue;
      try {
        if (type === 'whatsapp') {
          imageBase64
            ? await sendMedia(t.num, fullText, imageBase64, imageFileName || 'img.jpg', imageMime || 'image/jpeg')
            : await sendText(t.num, fullText);
        } else {
          await sendEmail(t.num, title || '(no subject)', body || '');
        }
        const r = { contactId: c.id, responsabile: c.responsabile, channel: t.label, number: t.num, status: 'ok' };
        job.results.push(r);
        notify(job, r);
        try { conversations.addMessage(t.num, { direction: 'out', text: fullText, status: 'sent', contactId: c.id, bulk: true }); } catch (_) {}
      } catch (err) {
        const r = { contactId: c.id, responsabile: c.responsabile, channel: t.label, number: t.num, status: 'error', error: err.message };
        job.results.push(r);
        notify(job, r);
        try { conversations.addMessage(t.num, { direction: 'out', text: fullText, status: 'error', contactId: c.id, bulk: true }); } catch (_) {}
      }
      if (type === 'whatsapp') await sleep(Math.floor(Math.random() * 8000) + 2000); // 2–10s random
    }

    job.done++;
    notifyProgress(job);
  }

  job.status = 'done';

  // Persist to message history
  try {
    const ok = job.results.filter(r => r.status === 'ok').length;
    history.create({
      type:             message.type || 'whatsapp',
      title:            message.title || null,
      body:             message.body || null,
      recipients_count: job.total,
      ok_count:         ok,
      error_count:      job.total - ok,
    });
  } catch (_) {}

  for (const client of job.clients) {
    client.write(`data: ${JSON.stringify({ done: job.done, total: job.total, finished: true })}\n\n`);
    client.end();
  }
  job.clients = [];
}

function notify(job, result) {
  for (const c of job.clients) {
    c.write(`data: ${JSON.stringify({ done: job.done, total: job.total, latest: result })}\n\n`);
  }
}

function notifyProgress(job) {
  for (const c of job.clients) {
    c.write(`data: ${JSON.stringify({ done: job.done, total: job.total })}\n\n`);
  }
}

router.post('/', (req, res) => {
  const { contactIds, message } = req.body;
  if (!contactIds?.length) return res.status(400).json({ error: 'contactIds required' });

  const contactList = contacts.find(contactIds);
  const jobId = crypto.randomUUID();
  const job = { status: 'running', total: contactList.length, done: 0, results: [], clients: [] };
  jobs.set(jobId, job);

  runJob(jobId, contactList, message).catch(err => {
    job.status = 'error';
    job.error = err.message;
  });

  res.json({ jobId, total: contactList.length });
});

router.get('/:jobId/events', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ done: job.done, total: job.total, finished: job.status === 'done' })}\n\n`);

  if (job.status === 'done') { res.end(); return; }

  job.clients.push(res);
  req.on('close', () => { job.clients = job.clients.filter(c => c !== res); });
});

router.get('/:jobId/results', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json({ status: job.status, total: job.total, done: job.done, results: job.results });
});

module.exports = router;
