import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from './supabase.js';
import { HttpError } from './http.js';

// Uploads a validated file (see middleware/upload.js) under a unique name.
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

// Private bucket the browser uploads into first (with a one-time signed
// URL), so files never pass through the API, whose host may cap request
// size (4.5 MB on Vercel). See middleware/upload.js.
export const STAGING_BUCKET = 'uploads';
const STAGING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const missingBucket = (error) => /bucket not found/i.test(error?.message || '');

export async function createStagedUpload(ext) {
  await sweepStaging();
  const path = `${Date.now()}-${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin.storage.from(STAGING_BUCKET).createSignedUploadUrl(path);
  if (error) {
    const err = missingBucket(error)
      ? new HttpError(503, 'The "uploads" storage bucket is missing. Run supabase/migrations.sql again.')
      : new HttpError(502, 'Could not prepare the upload.');
    err.cause = error;
    throw err;
  }
  return { bucket: STAGING_BUCKET, path, token: data.token };
}

// Returns the staged file's bytes, or null when it doesn't exist.
export async function readStagedFile(path) {
  const { data, error } = await supabaseAdmin.storage.from(STAGING_BUCKET).download(path);
  if (error) return null;
  return Buffer.from(await data.arrayBuffer());
}

export const removeStaged = (paths) => removeFromBucket(STAGING_BUCKET, paths);

// Deletes staged files nobody finished (closed tab, failed request). Never throws.
async function sweepStaging() {
  const { data, error } = await supabaseAdmin.storage.from(STAGING_BUCKET)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });
  if (error || !data) return;
  const cutoff = Date.now() - STAGING_MAX_AGE_MS;
  const stale = data.filter((item) => item.id && Date.parse(item.created_at) < cutoff).map((item) => item.name);
  await removeStaged(stale);
}

// Removes files from a bucket. Never throws: a leftover file must not
// fail the request that deleted or replaced its database record.
export async function removeFromBucket(bucket, paths) {
  const list = (paths || []).filter(Boolean);
  if (!list.length) return;
  const { error } = await supabaseAdmin.storage.from(bucket).remove(list);
  if (error) console.warn(`Could not remove ${list.length} file(s) from "${bucket}":`, error.message);
}
