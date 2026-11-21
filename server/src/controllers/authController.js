import { createToken, safeEqual } from '../utils/token.js';
import { ok, ApiError } from '../utils/ApiError.js';

export function makeAuthController(config) {
  return {
    // POST /api/auth/login { pin }
    login(req, res) {
      const pin = String(req.body?.pin ?? '').trim();
      if (!pin || !safeEqual(pin, config.appPin)) {
        req.recordFailedLogin?.();
        throw new ApiError(401, 'PIN ખોટો છે. ફરી પ્રયાસ કરો.', { code: 'WRONG_PIN' });
      }
      req.resetLoginAttempts?.();
      const { token, expiresAt } = createToken({
        secret: config.authSecret,
        pin: config.appPin,
        ttlDays: config.tokenTtlDays,
      });
      ok(res, { token, expiresAt });
    },

    // GET /api/auth/check (protected) -> confirms the stored token is still valid
    check(_req, res) {
      ok(res, { valid: true });
    },
  };
}
