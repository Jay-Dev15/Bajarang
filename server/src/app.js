import express from 'express';
import cors from 'cors';
import { buildRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(config) {
  const app = express();

  // Needed behind Render/Railway proxies so req.ip is the real client (rate limiting).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    });
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser tools (no Origin header) and configured frontends.
        if (!origin || config.clientOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '50kb' }));

  app.get('/', (_req, res) => res.json({ success: true, data: { name: 'BAJARANG API' } }));
  app.use('/api', buildRouter(config));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
