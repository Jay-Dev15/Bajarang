import crypto from 'node:crypto';

// Token format: v1.<expiresAtMs>.<hmac>
// The signing key includes the PIN, so changing APP_PIN logs out every device.
function sign(payload, secret, pin) {
  return crypto.createHmac('sha256', `${secret}:${pin}`).update(payload).digest('base64url');
}

export function createToken({ secret, pin, ttlDays }) {
  const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `v1.${expiresAt}`;
  return { token: `${payload}.${sign(payload, secret, pin)}`, expiresAt };
}

export function verifyToken(token, { secret, pin }) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`, secret, pin));
}

/** Constant-time string comparison (hashing first makes lengths equal). */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
