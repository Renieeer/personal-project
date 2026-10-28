export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Unwraps a Supabase { data, error } result, throwing an HttpError on failure.
export function must({ data, error }) {
  if (error) throw toHttpError(error);
  return data;
}

export function toHttpError(error) {
  switch (error.code) {
    case '23505': {
      const field = /Key \((\w+)\)/.exec(error.details || '')?.[1];
      return new HttpError(409, 'That value is already in use.', field ? { [field]: 'Already in use.' } : undefined);
    }
    case '23503':
      return new HttpError(400, 'A related record does not exist.');
    case '23502':
      return new HttpError(400, 'A required value is missing.');
    case '23514':
      return new HttpError(400, 'A value is outside the allowed range.');
    case '22P02':
    case '22007':
    case '22008':
      return new HttpError(400, 'A value has the wrong format.');
    default: {
      const err = new HttpError(500, 'Database request failed.');
      err.cause = error;
      return err;
    }
  }
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id.');
  return id;
}
