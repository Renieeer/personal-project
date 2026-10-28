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

  let payload;
  if (body !== undefined) {
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
  // Every API response is JSON. Anything else (usually index.html) means
  // /api is not reaching the server.
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError('The server is not reachable. Is the API deployed?', res.status);
  }
  return data;
}

// Files go from the browser straight to a private staging bucket with a
// signed URL, so they never pass through the API (hosts like Vercel cap
// request bodies at 4.5 MB). The API then checks them and moves them.
async function stageFile(file) {
  const { bucket, path, token } = await request('/admin/uploads', {
    method: 'POST',
    body: { type: file.type, size: file.size },
  });
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new ApiError(`Could not upload "${file.name}": ${error.message}`, 0);
  return { path, name: file.name };
}

// Like post(), but File values (alone or in a list) are staged first and
// sent as { path, name }.
async function upload(path, fields) {
  const body = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Blob) body[key] = await stageFile(value);
    else if (Array.isArray(value) && value.some((item) => item instanceof Blob)) {
      body[key] = await Promise.all(value.map(stageFile));
    } else body[key] = value;
  }
  return request(path, { method: 'POST', body });
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload,
  publicPost: (path, body) => request(path, { method: 'POST', body, auth: false }),
};
