// Vercel serverless entry point. Every request (see vercel.json) arrives here
// and is handled by the same Express app used locally by src/index.js.
import { loadConfig } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';

let app = null;
let config = null;

export default async function handler(req, res) {
  try {
    if (!app) {
      config = loadConfig();
      app = createApp(config);
    }
    await connectDB(config.mongoUri);
  } catch (err) {
    console.error('[startup]', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error: { message: 'સર્વર શરૂ થઈ શક્યું નહીં. થોડી વાર પછી ફરી પ્રયાસ કરો.', code: 'STARTUP_FAILED' },
      })
    );
    return;
  }
  return app(req, res);
}
