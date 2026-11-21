import { loadConfig } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  const config = loadConfig();
  await connectDB(config.mongoUri);

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log(`[server] BAJARANG API running on port ${config.port}`);
    console.log(`[server] Allowed frontend origins: ${config.clientOrigins.join(', ')}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
