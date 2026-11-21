import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'આ API મળ્યું નથી.', { code: 'ROUTE_NOT_FOUND' }));
}

// Express recognises error handlers by their 4 arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let body = { message: 'સર્વરમાં કંઈક ખોટું થયું. થોડી વાર પછી ફરી પ્રયાસ કરો.', code: 'SERVER_ERROR' };

  if (err instanceof ApiError) {
    status = err.status;
    body = { message: err.message, code: err.code, ...(err.fields && { fields: err.fields }) };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    body = { message: 'માહિતી બરાબર નથી.', code: 'VALIDATION_ERROR' };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { message: 'ID બરાબર નથી.', code: 'INVALID_ID' };
  } else if (err?.code === 11000) {
    status = 409;
    body = { message: 'આ નામ પહેલેથી છે.', code: 'DUPLICATE' };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { message: 'મોકલેલી માહિતી વાંચી શકાઈ નહીં.', code: 'BAD_JSON' };
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    body = { message: 'મોકલેલી માહિતી ઘણી મોટી છે.', code: 'TOO_LARGE' };
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ success: false, error: body });
}
