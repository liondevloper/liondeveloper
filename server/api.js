import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, ENQUIRY_STATUSES } from './db.js';

const COOKIE_NAME = 'lion_admin';
const SESSION_DAYS = 7;
// No fallback value on purpose: this repo is public, so a hardcoded secret would let anyone forge an admin session.
const secret = () => process.env.SESSION_SECRET || '';
const NO_SECRET = 'Admin access is disabled until SESSION_SECRET is set on the server.';

function requireSecret(_req, res, next) {
  if (!secret()) return res.status(503).json({ error: NO_SECRET });
  next();
}

const text = (value, max) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
};

// Simple brute-force guard: 8 failed logins per IP per 15 minutes.
const attempts = new Map();
function tooManyAttempts(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > 15 * 60_000) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= 8;
}
function recordFailure(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > 15 * 60_000) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

function requireAuth(req, res, next) {
  if (!secret()) return res.status(503).json({ error: NO_SECRET });
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    req.admin = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
}

function setSession(res, admin) {
  const token = jwt.sign({ sub: admin.id, email: admin.email }, secret(), { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export const api = Router();

/* ---------------------------------------------------------------- public */

api.post('/enquiries', async (req, res) => {
  const name = text(req.body?.name, 120);
  const details = text(req.body?.details, 4000);
  if (!name || !details) {
    return res.status(400).json({ error: 'Name and project details are required' });
  }

  try {
    await pool.query(
      `INSERT INTO enquiries (name, business, whatsapp, email, website_type, budget, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        name,
        text(req.body?.business, 120),
        text(req.body?.whatsapp, 40),
        text(req.body?.email, 160),
        text(req.body?.website_type, 80),
        text(req.body?.budget, 80),
        details,
      ],
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('[enquiries] insert failed', error);
    res.status(500).json({ error: 'Could not save enquiry' });
  }
});

api.get('/content', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM site_content WHERE key = 'site'");
    res.set('Cache-Control', 'no-store');
    res.json(rows[0]?.value ?? {});
  } catch (error) {
    console.error('[content] read failed', error);
    res.status(500).json({ error: 'Could not load content' });
  }
});

/* ------------------------------------------------------------------ auth */

api.post('/auth/login', requireSecret, async (req, res) => {
  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const email = text(req.body?.email, 160).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  attempts.delete(ip);
  setSession(res, admin);
  res.json({ email: admin.email });
});

api.post('/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

api.get('/auth/me', requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

api.post('/auth/password', requireAuth, async (req, res) => {
  const current = typeof req.body?.current === 'string' ? req.body.current : '';
  const next = typeof req.body?.next === 'string' ? req.body.next : '';
  if (next.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE id = $1', [req.admin.sub]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(current, admin.password_hash))) {
    return res.status(401).json({ error: 'Current password is wrong' });
  }

  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(next, 10), admin.id]);
  setSession(res, admin);
  res.json({ ok: true });
});

/* ----------------------------------------------------------------- admin */

api.get('/enquiries', requireAuth, async (req, res) => {
  const status = ENQUIRY_STATUSES.includes(req.query.status) ? req.query.status : null;
  const search = text(req.query.q, 80);

  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(name ILIKE $${params.length} OR business ILIKE $${params.length}
      OR email ILIKE $${params.length} OR whatsapp ILIKE $${params.length} OR details ILIKE $${params.length})`);
  }

  const { rows } = await pool.query(
    `SELECT * FROM enquiries
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC
     LIMIT 500`,
    params,
  );
  res.json(rows);
});

api.get('/enquiries/export', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
  const columns = ['id', 'created_at', 'name', 'business', 'whatsapp', 'email', 'website_type', 'budget', 'status', 'details', 'notes'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="lion-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

api.patch('/enquiries/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });

  const updates = [];
  const params = [];
  if (typeof req.body?.status === 'string') {
    if (!ENQUIRY_STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Unknown status' });
    params.push(req.body.status);
    updates.push(`status = $${params.length}`);
  }
  if (typeof req.body?.notes === 'string') {
    params.push(text(req.body.notes, 4000));
    updates.push(`notes = $${params.length}`);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE enquiries SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

api.delete('/enquiries/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });
  await pool.query('DELETE FROM enquiries WHERE id = $1', [id]);
  res.json({ ok: true });
});

api.put('/content', requireAuth, async (req, res) => {
  const value = req.body;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return res.status(400).json({ error: 'Content must be an object' });
  }

  try {
    await pool.query(
      `INSERT INTO site_content (key, value, updated_at) VALUES ('site', $1, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [value],
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('[content] save failed', error);
    res.status(500).json({ error: 'Could not save content' });
  }
});

api.get('/dashboard', requireAuth, async (_req, res) => {
  const [totals, byStatus, byType, recent] = await Promise.all([
    pool.query(`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS last_30_days,
        COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS last_7_days
      FROM enquiries`),
    pool.query('SELECT status, COUNT(*)::int AS count FROM enquiries GROUP BY status'),
    pool.query(`SELECT website_type, COUNT(*)::int AS count FROM enquiries
      WHERE website_type <> '' AND website_type IS NOT NULL
      GROUP BY website_type ORDER BY count DESC LIMIT 1`),
    pool.query('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5'),
  ]);

  const statusCounts = Object.fromEntries(ENQUIRY_STATUSES.map((status) => [status, 0]));
  for (const row of byStatus.rows) statusCounts[row.status] = row.count;

  res.json({
    ...totals.rows[0],
    statusCounts,
    topWebsiteType: byType.rows[0]?.website_type ?? null,
    recent: recent.rows,
  });
});
