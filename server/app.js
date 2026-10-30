import express from 'express';
import cookieParser from 'cookie-parser';
import { api } from './api.js';

export function createApp() {
  const app = express();
  // Trust only the proxy directly in front of the app, so a visitor cannot fake their IP
  // with their own X-Forwarded-For header. On Vercel the IP comes from x-vercel-forwarded-for (see api.js).
  app.set('trust proxy', 1);
  // Room for one compressed template image (the admin panel shrinks uploads before sending).
  // These two routes are registered first; every other request gets the small default limit.
  app.post('/api/images', express.json({ limit: '3mb' }));
  app.put('/api/content', express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  app.use('/api', api);

  // Always answer API errors with JSON and never leak a stack trace.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = Number(error?.status || error?.statusCode) || 500;
    if (status === 413) return res.status(413).json({ error: 'Request is too large' });
    if (status >= 400 && status < 500 && error?.expose) {
      return res.status(status).json({ error: 'Bad request' });
    }
    console.error('[api] unhandled error', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}
