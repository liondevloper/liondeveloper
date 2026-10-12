import { pool } from '../db.js';

/**
 * Every table here is prefixed `pay_` so the payments platform never collides with
 * the website's own tables. Migrations are additive only: this database is shared
 * with the published app, so a dropped column takes live data with it.
 */
export async function initPayDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pay_merchants (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      business_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL DEFAULT '',
      -- Live mode stays shut per merchant until their KYC and connector approval are on file.
      live_access   BOOLEAN NOT NULL DEFAULT false,
      status        TEXT NOT NULL DEFAULT 'active',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS pay_merchants_created_at_idx ON pay_merchants (created_at DESC);');
}
