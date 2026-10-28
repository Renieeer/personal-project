import { supabase } from './supabase.js';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError('You are signed out. Please sign in again.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) await supabase.auth.signOut();
    throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.details);
  }
  return data;
}

function toFormData(fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(key, item));
    else if (value !== undefined && value !== null) form.append(key, value);
  }
  return form;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, fields) => request(path, { method: 'POST', body: toFormData(fields) }),
  publicPost: (path, body) => request(path, { method: 'POST', body, auth: false }),
};
