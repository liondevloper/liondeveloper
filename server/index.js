import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { initDatabase } from './db.js';

const port = Number(process.env.PORT) || 5173;
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');

// The site must render even when the database is unreachable; only the API degrades.
try {
  await initDatabase();
} catch (error) {
  console.error('[db] init failed, serving the site without the API:', error.message);
}

const app = createApp();
app.use(express.static(distDir, { index: false, maxAge: '1h' }));
app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(port, '0.0.0.0', () => {
  console.log(`Lion Developer running on port ${port}`);
});
