import { HttpError } from '../lib/http.js';
import { createStagedUpload, readStagedFile, removeStaged } from '../lib/storage.js';

const MB = 1024 * 1024;

// Allowed MIME types (mapped to the stored file extension) and size per upload kind.
const RULES = {
  image: {
    maxSize: 5 * MB,
    label: 'JPG, PNG, WebP or GIF',
    types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' },
  },
  pdf: {
    maxSize: 10 * MB,
    label: 'PDF',
    types: { 'application/pdf': 'pdf' },
  },
  icon: {
    maxSize: 1 * MB,
    label: 'PNG or ICO',
    types: { 'image/png': 'png', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' },
  },
};

// Every type any kind accepts. Staging only checks these; the route's kind
// is checked when the file is used.
const STAGE_TYPES = Object.assign({}, ...Object.values(RULES).map((rule) => rule.types));
const STAGE_MAX_SIZE = Math.max(...Object.values(RULES).map((rule) => rule.maxSize));
const EXT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', ico: 'image/x-icon' };
const STAGED_PATH = /^\d+-[0-9a-f-]{36}\.(jpg|png|webp|gif|pdf|ico)$/;

const startsWith = (buf, bytes, offset = 0) => buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);
const ascii = (text) => [...text].map((c) => c.charCodeAt(0));

// Magic-byte checks, so a renamed file cannot pass as a different type.
const SIGNATURES = {
  jpg: (buf) => startsWith(buf, [0xff, 0xd8, 0xff]),
  png: (buf) => startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: (buf) => startsWith(buf, ascii('GIF87a')) || startsWith(buf, ascii('GIF89a')),
  webp: (buf) => startsWith(buf, ascii('RIFF')) && startsWith(buf, ascii('WEBP'), 8),
  pdf: (buf) => startsWith(buf, ascii('%PDF-')),
  ico: (buf) => startsWith(buf, [0x00, 0x00, 0x01, 0x00]),
};

// Step 1: { type, size } -> { bucket, path, token }. The browser uploads
// the file there itself (supabase.storage...uploadToSignedUrl).
export async function stageUpload({ type, size } = {}) {
  const ext = STAGE_TYPES[type];
  if (!ext) throw new HttpError(400, 'Unsupported file type. Allowed: JPG, PNG, WebP, GIF, PDF or ICO.');
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, 'The file is empty.');
  if (size > STAGE_MAX_SIZE) throw new HttpError(400, `File is too large. Maximum size is ${STAGE_MAX_SIZE / MB} MB.`);
  return createStagedUpload(ext);
}

async function loadStaged(rule, { path, name }) {
  const originalname = typeof name === 'string' ? name.slice(0, 200) : 'file';
  const ext = STAGED_PATH.exec(path)[1];
  if (!Object.values(rule.types).includes(ext)) {
    throw new HttpError(400, `"${originalname}" is not supported here. Allowed: ${rule.label}.`);
  }
  const buffer = await readStagedFile(path);
  if (!buffer) throw new HttpError(400, `"${originalname}" was not uploaded. Please try again.`);
  if (buffer.length > rule.maxSize) {
    throw new HttpError(400, `"${originalname}" is too large. Maximum size is ${rule.maxSize / MB} MB.`);
  }
  if (!SIGNATURES[ext](buffer)) throw new HttpError(400, `"${originalname}" is not a valid ${rule.label} file.`);
  return { buffer, mimetype: EXT_TYPES[ext], ext, size: buffer.length, originalname };
}

// Step 2: reads the staged files named in req.body[field] ({ path, name } or
// a list of them), validates type, size and content for this kind, and sets
// req.files to [{ buffer, mimetype, ext, size, originalname }]. The staged
// copies are removed before the route runs.
export function handleUpload(kind, { field = 'file', maxCount = 1 } = {}) {
  const rule = RULES[kind];
  if (!rule) throw new Error(`Unknown upload kind: ${kind}`);

  return async (req, res, next) => {
    const items = [].concat(req.body?.[field] ?? []);
    const valid = items.every((item) => typeof item?.path === 'string' && STAGED_PATH.test(item.path));
    const paths = valid ? items.map((item) => item.path) : [];

    let files;
    let error;
    if (!items.length) error = new HttpError(400, 'No file was uploaded.');
    else if (!valid) error = new HttpError(400, 'Invalid upload.');
    else if (items.length > maxCount) {
      error = new HttpError(400, maxCount > 1 ? `Upload up to ${maxCount} files at a time.` : 'Upload one file at a time.');
    } else {
      try {
        files = await Promise.all(items.map((item) => loadStaged(rule, item)));
      } catch (err) {
        error = err;
      }
    }

    await removeStaged(paths);
    if (error) return next(error);
    req.files = files;
    next();
  };
}
