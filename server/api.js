import { Router } from 'express';
import { createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, ENQUIRY_STATUSES } from './db.js';

const COOKIE_NAME = 'lion_admin';
const SESSION_DAYS = 7;
// No fallback value on purpose: this repo is public, so a hardcoded secret would let anyone forge an admin session.
const secret = () => process.env.SESSION_SECRET || '';
const NO_SECRET = 'Admin access is disabled until SESSION_SECRET is set on the server.';
// Cookies only travel over HTTPS on the live site; local dev runs on plain http.
const SECURE_COOKIE = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// How long a video upload ticket stays valid. Long enough for a 50 MB upload on a slow phone connection.
const VIDEO_TICKET_MINUTES = 30;

// Brute-force and spam limits, stored in login_attempts so every serverless instance shares them.
const LOGIN_LIMIT = { max: 8, minutes: 15 };
// Mobile networks in India often share one IP between many people, so this is kept generous.
const ENQUIRY_LIMIT = { max: 10, minutes: 60 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_RE = /^[0-9+\s-]*$/;

function requireSecret(_req, res, next) {
  if (!secret()) return res.status(503).json({ error: NO_SECRET });
  next();
}

const text = (value, max) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
};

// On Vercel, x-vercel-forwarded-for is set by Vercel itself and cannot be spoofed by the visitor.
function clientIp(req) {
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (process.env.VERCEL && typeof vercelIp === 'string' && vercelIp) {
    return vercelIp.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

async function isRateLimited(key, { max, minutes }) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM login_attempts
     WHERE ip = $1 AND created_at > now() - make_interval(mins => $2)`,
    [key, minutes],
  );
  return rows[0].count >= max;
}

const recordAttempt = (key) => pool.query('INSERT INTO login_attempts (ip) VALUES ($1)', [key]);
const clearAttempts = (key) => pool.query('DELETE FROM login_attempts WHERE ip = $1', [key]);

// Keeps the table small. Failures here never block the request.
function pruneAttempts() {
  pool.query("DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'").catch((error) => {
    console.error('[rate-limit] prune failed', error);
  });
}

// A short fingerprint of the password hash. Changing the password changes it, which signs out every old session.
const passwordVersion = (passwordHash) =>
  createHmac('sha256', secret()).update(passwordHash).digest('hex').slice(0, 16);

async function requireAuth(req, res, next) {
  if (!secret()) return res.status(503).json({ error: NO_SECRET });
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
  if (typeof payload?.pv !== 'string') return res.status(401).json({ error: 'Session expired' });

  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE id = $1', [payload.sub]);
  const admin = rows[0];
  if (!admin || passwordVersion(admin.password_hash) !== payload.pv) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.admin = { sub: admin.id, email: admin.email };
  next();
}

function setSession(res, admin) {
  const token = jwt.sign(
    { sub: admin.id, email: admin.email, pv: passwordVersion(admin.password_hash) },
    secret(),
    { expiresIn: `${SESSION_DAYS}d` },
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

// Stops spreadsheet apps from running a cell as a formula when the CSV is opened.
const csvCell = (value) => {
  let cell = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
};

export const api = Router();

/* ---------------------------------------------------------------- public */

api.post('/enquiries', async (req, res) => {
  const name = text(req.body?.name, 120);
  const details = text(req.body?.details, 4000);
  const email = text(req.body?.email, 160);
  const whatsapp = text(req.body?.whatsapp, 40);
  if (!name || !details) {
    return res.status(400).json({ error: 'Name and project details are required' });
  }
  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (!WHATSAPP_RE.test(whatsapp)) {
    return res.status(400).json({ error: 'WhatsApp number can only contain digits, +, spaces and -' });
  }

  const limitKey = `enq:${clientIp(req)}`;
  try {
    if (await isRateLimited(limitKey, ENQUIRY_LIMIT)) {
      return res.status(429).json({
        error: 'You have sent several enquiries already. Please try again in an hour, or message us on WhatsApp.',
      });
    }

    await pool.query(
      `INSERT INTO enquiries (name, business, whatsapp, email, website_type, budget, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        name,
        text(req.body?.business, 120),
        whatsapp,
        email,
        text(req.body?.website_type, 80),
        text(req.body?.budget, 80),
        details,
      ],
    );
    await recordAttempt(limitKey);
    pruneAttempts();
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

// Uploaded images never change once stored, so browsers and the CDN can cache them for a year.
api.get('/images/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });
  try {
    const { rows } = await pool.query('SELECT mime, data FROM images WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.set('Content-Type', rows[0].mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(rows[0].data);
  } catch (error) {
    console.error('[images] read failed', error);
    res.status(500).json({ error: 'Could not load image' });
  }
});

/* ------------------------------------------------------------------ auth */

api.post('/auth/login', requireSecret, async (req, res) => {
  const ip = clientIp(req);
  if (await isRateLimited(ip, LOGIN_LIMIT)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const email = text(req.body?.email, 160).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    await recordAttempt(ip);
    pruneAttempts();
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  await clearAttempts(ip);
  setSession(res, admin);
  res.json({ email: admin.email });
});

api.post('/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, secure: SECURE_COOKIE, sameSite: 'lax' });
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

  const newHash = await bcrypt.hash(next, 10);
  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, admin.id]);
  // The new hash gives a new session fingerprint: this browser stays signed in, all others are signed out.
  setSession(res, { ...admin, password_hash: newHash });
  res.json({ ok: true });
});

/* ----------------------------------------------------------------- admin */

// Accepts a base64 data URL from the admin panel and returns the public address of the stored image.
api.post('/images', requireAuth, async (req, res) => {
  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '');
  if (!match || !IMAGE_TYPES.includes(match[1])) {
    return res.status(400).json({ error: 'Upload a JPG, PNG or WebP image' });
  }
  const data = Buffer.from(match[2], 'base64');
  if (data.length > MAX_IMAGE_BYTES) return res.status(400).json({ error: 'Image is too large (max 2 MB)' });

  try {
    const { rows } = await pool.query('INSERT INTO images (mime, data) VALUES ($1, $2) RETURNING id', [match[1], data]);
    res.status(201).json({ url: `/api/images/${rows[0].id}` });
  } catch (error) {
    console.error('[images] insert failed', error);
    res.status(500).json({ error: 'Could not save image' });
  }
});

// Videos are too big for this server, so the browser uploads them straight to Supabase Storage.
// The storage rules only accept a file inside a folder named after a valid, unexpired ticket,
// and only a signed-in admin can get one here.
api.post('/videos/ticket', requireAuth, async (_req, res) => {
  const ticket = randomBytes(24).toString('hex');
  try {
    await pool.query('DELETE FROM upload_tickets WHERE expires_at < now()');
    await pool.query(
      `INSERT INTO upload_tickets (token, expires_at) VALUES ($1, now() + make_interval(mins => $2))`,
      [ticket, VIDEO_TICKET_MINUTES],
    );
    res.status(201).json({ ticket });
  } catch (error) {
    console.error('[videos] ticket failed', error);
    res.status(500).json({ error: 'Could not start the video upload' });
  }
});

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
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n');

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
