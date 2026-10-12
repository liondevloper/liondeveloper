import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { pool } from '../db.js';
import { ALL_MODES, MODES, modeAvailability } from './config.js';
import { clearSession, issueSession, NO_SECRET_MESSAGE, requireMerchant, sessionReady } from './session.js';

export const payApi = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 10;

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const merchantId = () => `mer_${randomBytes(12).toString('hex')}`;

// Eight failed sign-in attempts per IP per 15 minutes.
const attempts = new Map();
const WINDOW_MS = 15 * 60_000;

function tooManyAttempts(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= 8;
}

function recordFailure(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else entry.count += 1;
}

const publicMerchant = (row) => ({
  id: row.id,
  email: row.email,
  businessName: row.business_name,
  contactPhone: row.contact_phone,
  liveAccess: row.live_access,
  status: row.status,
  createdAt: row.created_at,
});

/* ------------------------------------------------------------------ config */

/**
 * The dashboard reads this to label every screen with the mode it is in. Modes the
 * server has no credentials for are reported unavailable with the reason, so nobody
 * mistakes an unconfigured live mode for a working one.
 */
payApi.get('/config', (_req, res) => {
  const availability = modeAvailability();
  res.json({
    modes: ALL_MODES.map((mode) => ({
      mode,
      available: availability[mode].available,
      reason: availability[mode].reason,
      movesRealMoney: mode === MODES.LIVE,
    })),
    defaultMode: MODES.MOCK,
    accountsEnabled: sessionReady(),
  });
});

/* -------------------------------------------------------------- merchants */

payApi.post('/merchants/register', async (req, res) => {
  if (!sessionReady()) return res.status(503).json({ error: NO_SECRET_MESSAGE });

  const email = text(req.body?.email, 200).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const businessName = text(req.body?.businessName, 120);
  const contactPhone = text(req.body?.contactPhone, 20);

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
  }
  if (!businessName) return res.status(400).json({ error: 'Business name is required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const id = merchantId();
    const { rows } = await pool.query(
      `INSERT INTO pay_merchants (id, email, password_hash, business_name, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [id, email, hash, businessName, contactPhone],
    );
    if (rows.length === 0) return res.status(409).json({ error: 'An account with this email already exists' });

    issueSession(res, rows[0]);
    res.status(201).json({ merchant: publicMerchant(rows[0]) });
  } catch (error) {
    console.error('[pay] register failed:', error.message);
    res.status(500).json({ error: 'Could not create the account' });
  }
});

payApi.post('/merchants/login', async (req, res) => {
  if (!sessionReady()) return res.status(503).json({ error: NO_SECRET_MESSAGE });

  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const email = text(req.body?.email, 200).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  try {
    const { rows } = await pool.query('SELECT * FROM pay_merchants WHERE email = $1', [email]);
    const merchant = rows[0];
    const ok = merchant ? await bcrypt.compare(password, merchant.password_hash) : false;
    if (!ok) {
      recordFailure(ip);
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    if (merchant.status !== 'active') {
      return res.status(403).json({ error: 'This account is suspended' });
    }

    attempts.delete(ip);
    issueSession(res, merchant);
    res.json({ merchant: publicMerchant(merchant) });
  } catch (error) {
    console.error('[pay] login failed:', error.message);
    res.status(500).json({ error: 'Could not sign in' });
  }
});

payApi.post('/merchants/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

payApi.get('/merchants/me', requireMerchant, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pay_merchants WHERE id = $1', [req.merchant.sub]);
    if (rows.length === 0) {
      clearSession(res);
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    res.json({ merchant: publicMerchant(rows[0]) });
  } catch (error) {
    console.error('[pay] me failed:', error.message);
    res.status(500).json({ error: 'Could not load the account' });
  }
});
