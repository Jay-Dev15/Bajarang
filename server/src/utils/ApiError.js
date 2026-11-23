export class ApiError extends Error {
  constructor(status, message, { code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const notFound = (message = 'માહિતી મળી નથી.') => new ApiError(404, message, { code: 'NOT_FOUND' });

export const badRequest = (message, fields) =>
  new ApiError(400, message, { code: 'VALIDATION_ERROR', fields });

export const ok = (res, data, status = 200, meta) =>
  res.status(status).json({ success: true, data, ...(meta && { meta }) });
