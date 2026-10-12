import express from 'express';
import cookieParser from 'cookie-parser';
import { api } from './api.js';
import { payApi } from './pay/routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '500kb' }));
  app.use(cookieParser());
  app.use('/api', api);
  app.use('/api/pay', payApi);
  return app;
}
