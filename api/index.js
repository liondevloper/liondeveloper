// Serverless entry for Vercel: the same Express API that server/index.js serves.
// Vercel serves the built site from /dist and routes /api/* here (see vercel.json).
import { createApp } from '../server/app.js';
import { initDatabase } from '../server/db.js';

const app = createApp();
let ready;

export default async function handler(req, res) {
  ready ??= initDatabase();
  try {
    await ready;
  } catch (error) {
    ready = undefined;
    console.error('[api] database init failed', error);
    return res.status(500).json({ error: 'Database is not reachable' });
  }
  return app(req, res);
}
