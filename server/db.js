import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// One shared pool for the whole process — never create a pool per request.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30_000,
  ssl: { rejectUnauthorized: false },
});

export const ENQUIRY_STATUSES = ['new', 'contacted', 'discussion', 'won', 'lost'];

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      business      TEXT,
      whatsapp      TEXT,
      email         TEXT,
      website_type  TEXT,
      budget        TEXT,
      details       TEXT,
      status        TEXT NOT NULL DEFAULT 'new',
      notes         TEXT NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);');

  await seedAdmin();
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) return;

  const existing = await pool.query('SELECT id FROM admin_users LIMIT 1');
  if (existing.rowCount > 0) return;

  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)', [email, hash]);
  console.log(`[admin] created admin account for ${email}`);
}
