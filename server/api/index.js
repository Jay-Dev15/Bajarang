// Vercel serverless entry point. Every request (see vercel.json) arrives here
// and is handled by the same Express app used locally by src/index.js.
import { loadConfig } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';

// Routes that never touch MongoDB, so they answer without waiting for it.
// CORS preflight (OPTIONS) is sent by the browser before every authorised
// request, so letting it skip the database matters most on a cold start.
const NO_DB_PATHS = new Set(['/', '/api/health', '/api/auth/login', '/api/auth/check']);

let app = null;
let config = null;
let startupError = null;

// Build the app and start connecting as soon as the function loads, so the
// connection is already on its way when the first request arrives.
try {
  config = loadConfig();
  app = createApp(config);
  connectDB(config.mongoUri).catch(() => {}); // retried per request below
} catch (err) {
  startupError = err;
}

function sendError(res, status, message, code) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ success: false, error: { message, code } }));
}

export default async function handler(req, res) {
  if (startupError) {
    console.error('[startup]', startupError.message);
    return sendError(res, 500, 'સર્વર શરૂ થઈ શક્યું નહીં. થોડી વાર પછી ફરી પ્રયાસ કરો.', 'STARTUP_FAILED');
  }

  const path = (req.url || '/').split('?')[0].replace(/\/$/, '') || '/';
  if (req.method !== 'OPTIONS' && !NO_DB_PATHS.has(path)) {
    try {
      await connectDB(config.mongoUri);
    } catch (err) {
      console.error('[db]', err.message);
      return sendError(res, 503, 'ડેટાબેઝ સાથે જોડાણ થયું નહીં. થોડી વાર પછી ફરી પ્રયાસ કરો.', 'DB_UNAVAILABLE');
    }
  }
  return app(req, res);
}
