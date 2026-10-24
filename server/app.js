import express from 'express';
import cookieParser from 'cookie-parser';
import { api } from './api.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  // Room for one compressed template image (the admin panel shrinks uploads before sending).
  app.use(express.json({ limit: '3mb' }));
  app.use(cookieParser());
  app.use('/api', api);
  return app;
}
