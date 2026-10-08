import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app.js';
import { initDatabase } from './db.js';

const port = Number(process.env.PORT) || 5173;

await initDatabase();

const app = createApp();
const httpServer = createHttpServer(app);

// Vite runs in middleware mode so the site and the API share one port.
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: { server: httpServer } },
  appType: 'spa',
});
app.use(vite.middlewares);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Lion Developer dev server running on http://localhost:${port}`);
});
