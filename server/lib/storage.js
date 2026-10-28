import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from './supabase.js';
import { HttpError } from './http.js';

// Uploads a validated multer file (see middleware/upload.js) under a unique name.
export async function uploadToBucket(bucket, file, folder) {
  const path = `${folder}/${Date.now()}-${randomUUID()}.${file.ext}`;
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    const err = new HttpError(502, 'File upload to storage failed.');
    err.cause = error;
    throw err;
  }
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

// Removes files from a bucket. Never throws: a leftover file must not
// fail the request that deleted or replaced its database record.
export async function removeFromBucket(bucket, paths) {
  const list = (paths || []).filter(Boolean);
  if (!list.length) return;
  const { error } = await supabaseAdmin.storage.from(bucket).remove(list);
  if (error) console.warn(`Could not remove ${list.length} file(s) from "${bucket}":`, error.message);
}
