import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

export function requireAuth(config) {
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token || !verifyToken(token, { secret: config.authSecret, pin: config.appPin })) {
      return next(new ApiError(401, 'કૃપા કરીને PIN દાખલ કરો.', { code: 'UNAUTHORIZED' }));
    }
    next();
  };
}

/** Small in-memory limiter for wrong PIN attempts, per IP address. */
export function loginRateLimit({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();

  return (req, _res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = attempts.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      attempts.set(key, entry);
    }
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
    }
    if (entry.count >= max) {
      return next(
        new ApiError(429, 'ઘણા ખોટા પ્રયાસો થયા. 15 મિનિટ પછી ફરી પ્રયાસ કરો.', { code: 'TOO_MANY_ATTEMPTS' })
      );
    }
    req.recordFailedLogin = () => {
      entry.count += 1;
    };
    req.resetLoginAttempts = () => attempts.delete(key);
    next();
  };
}
