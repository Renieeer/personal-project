import { HttpError } from './http.js';

const URL_RE = /^(https?:\/\/\S+|mailto:\S+|tel:\+?[\d\s()-]+)$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;

// Field spec builders. Options: required, max, min, notNull (empty -> '' instead of null).
export const t = {
  text: (opts = {}) => ({ type: 'text', max: 255, ...opts }),
  url: (opts = {}) => ({ type: 'url', max: 500, ...opts }),
  email: (opts = {}) => ({ type: 'email', max: 200, ...opts }),
  color: (opts = {}) => ({ type: 'color', ...opts }),
  int: (opts = {}) => ({ type: 'int', ...opts }),
  bool: (opts = {}) => ({ type: 'bool', ...opts }),
  date: (opts = {}) => ({ type: 'date', ...opts }),
  tags: (opts = {}) => ({ type: 'tags', maxItems: 30, maxLength: 40, ...opts }),
};

function coerce(spec, raw) {
  switch (spec.type) {
    case 'text':
    case 'url':
    case 'email':
    case 'color': {
      if (raw === null) return { value: spec.notNull ? '' : null };
      if (typeof raw !== 'string' && typeof raw !== 'number') return { error: 'Must be text.' };
      const value = String(raw).trim();
      if (!value) return { value: spec.notNull ? '' : null };
      if (spec.max && value.length > spec.max) return { error: `Must be at most ${spec.max} characters.` };
      if (spec.type === 'url' && !URL_RE.test(value)) return { error: 'Must be a valid URL (https://, mailto: or tel:).' };
      if (spec.type === 'email' && !EMAIL_RE.test(value)) return { error: 'Must be a valid email address.' };
      if (spec.type === 'color' && !COLOR_RE.test(value)) return { error: 'Must be a hex color such as #b3441e.' };
      return { value: spec.type === 'color' ? value.toLowerCase() : value };
    }
    case 'int': {
      if (raw === null || raw === '') return { value: null };
      const n = typeof raw === 'string' ? Number(raw.trim()) : raw;
      if (!Number.isInteger(n)) return { error: 'Must be a whole number.' };
      if (spec.min !== undefined && n < spec.min) return { error: `Must be ${spec.min} or more.` };
      if (spec.max !== undefined && n > spec.max) return { error: `Must be ${spec.max} or less.` };
      return { value: n };
    }
    case 'bool': {
      if (raw === true || raw === 'true') return { value: true };
      if (raw === false || raw === 'false') return { value: false };
      return { error: 'Must be true or false.' };
    }
    case 'date': {
      if (raw === null || raw === '') return { value: null };
      if (typeof raw !== 'string' || !DATE_RE.test(raw)) return { error: 'Must be a date (YYYY-MM-DD).' };
      const date = new Date(`${raw}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return { error: 'Must be a real date.' };
      return { value: raw };
    }
    case 'tags': {
      if (raw === null || raw === '') return { value: [] };
      const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : null;
      if (!list) return { error: 'Must be a list.' };
      const value = [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
      if (value.length > spec.maxItems) return { error: `Use at most ${spec.maxItems} items.` };
      if (value.some((item) => item.length > spec.maxLength)) return { error: `Each item must be at most ${spec.maxLength} characters.` };
      return { value };
    }
    default:
      throw new Error(`Unknown field type: ${spec.type}`);
  }
}

// Validates a request body against a schema and returns only the known fields.
// With partial: true (updates), missing fields are left out instead of failing.
export function validate(schema, body, { partial = false } = {}) {
  const data = {};
  const errors = {};
  const source = body && typeof body === 'object' ? body : {};

  for (const [field, spec] of Object.entries(schema)) {
    const raw = source[field];
    if (raw === undefined) {
      if (!partial && spec.required) errors[field] = 'Required.';
      continue;
    }
    const result = coerce(spec, raw);
    if (result.error) {
      errors[field] = result.error;
    } else if (spec.required && (result.value === null || result.value === '')) {
      errors[field] = 'Required.';
    } else {
      data[field] = result.value;
    }
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);
  return data;
}
