import multer from 'multer';
import { HttpError } from '../lib/http.js';

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

const uploaders = new Map();

function getUploader(kind, field, maxCount) {
  const key = `${kind}:${field}:${maxCount}`;
  if (!uploaders.has(key)) {
    const rule = RULES[kind];
    const instance = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: rule.maxSize, files: maxCount, fields: 10 },
      fileFilter: (req, file, cb) => {
        if (rule.types[file.mimetype]) cb(null, true);
        else cb(new HttpError(400, `Unsupported file type. Allowed: ${rule.label}.`));
      },
    });
    uploaders.set(key, instance.array(field, maxCount));
  }
  return uploaders.get(key);
}

// Parses a multipart upload into req.files and validates type, size and content.
export function handleUpload(kind, { field = 'file', maxCount = 1 } = {}) {
  const rule = RULES[kind];
  if (!rule) throw new Error(`Unknown upload kind: ${kind}`);
  const upload = getUploader(kind, field, maxCount);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new HttpError(400, `File is too large. Maximum size is ${rule.maxSize / MB} MB.`));
          }
          if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new HttpError(400, maxCount > 1 ? `Upload up to ${maxCount} files at a time.` : 'Upload one file at a time.'));
          }
          return next(new HttpError(400, err.message));
        }
        return next(err);
      }

      const files = req.files || [];
      if (!files.length) return next(new HttpError(400, 'No file was uploaded.'));

      for (const file of files) {
        const ext = rule.types[file.mimetype];
        if (!SIGNATURES[ext](file.buffer)) {
          return next(new HttpError(400, `"${file.originalname}" is not a valid ${rule.label} file.`));
        }
        file.ext = ext;
      }
      next();
    });
  };
}
