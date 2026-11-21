import mongoose from 'mongoose';

let connecting = null;

/**
 * Connects once and reuses the connection. On Vercel the same function
 * instance handles many requests, so later calls return immediately.
 */
export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    mongoose.set('strictQuery', true);
    mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));
    mongoose.connection.on('error', (err) => console.error('[db] MongoDB error:', err.message));

    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 })
      .then(() => console.log(`[db] Connected to MongoDB (database: ${mongoose.connection.name})`))
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  await connecting;
}

export async function disconnectDB() {
  await mongoose.connection.close();
  connecting = null;
}
