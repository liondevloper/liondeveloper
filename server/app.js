import express from 'express';
import cookieParser from 'cookie-parser';
import { api } from './api.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '500kb' }));
  app.use(cookieParser());
  app.use('/api', api);
  return app;
}
