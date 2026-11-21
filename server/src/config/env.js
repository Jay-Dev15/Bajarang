import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function loadConfig() {
  const appPin = required('APP_PIN');
  if (!/^\d{4,8}$/.test(appPin)) {
    throw new Error('APP_PIN must be 4 to 8 digits.');
  }
  const authSecret = required('AUTH_SECRET');
  if (authSecret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long.');
  }

  return {
    port: Number(process.env.PORT) || 5000,
    mongoUri: required('MONGODB_URI'),
    appPin,
    authSecret,
    tokenTtlDays: Number(process.env.TOKEN_TTL_DAYS) || 60,
    clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
    isProduction: process.env.NODE_ENV === 'production',
  };
}
