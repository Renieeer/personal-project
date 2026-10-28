import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler, must } from '../lib/http.js';

// Interface text (button labels, form labels, …) stored as one JSON object
// of key -> text. The client owns the list of keys and their defaults, so the
// server only checks their shape. An empty value removes a key, which puts
// the default text back.
const KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;
const MAX_KEYS = 100;
const MAX_LENGTH = 300;

const router = express.Router();

async function loadRow() {
  const ensured = await supabaseAdmin.from('ui_text').upsert({ id: 1 }, { onConflict: 'id', ignoreDuplicates: true });
  if (ensured.error && ['42P01', 'PGRST205'].includes(ensured.error.code)) {
    throw new HttpError(503, 'The ui_text table is missing. Run supabase/migrations.sql again.');
  }
  must(ensured);
  return must(await supabaseAdmin.from('ui_text').select('*').eq('id', 1).single());
}

router.get('/', asyncHandler(async (req, res) => {
  res.json(await loadRow());
}));

// PUT { texts: { key: 'text' | null } } merges into the stored texts.
router.put('/', asyncHandler(async (req, res) => {
  const patch = req.body?.texts;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new HttpError(400, 'texts must be an object of key: text.');
  }

  const row = await loadRow();
  const texts = { ...row.texts };
  const errors = {};
  for (const [key, raw] of Object.entries(patch)) {
    if (!KEY_RE.test(key)) {
      errors[key] = 'Unknown text key.';
    } else if (raw === null) {
      delete texts[key];
    } else if (typeof raw !== 'string') {
      errors[key] = 'Must be text.';
    } else if (raw.trim().length > MAX_LENGTH) {
      errors[key] = `Must be at most ${MAX_LENGTH} characters.`;
    } else if (raw.trim()) {
      texts[key] = raw.trim();
    } else {
      delete texts[key];
    }
  }
  if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);
  if (Object.keys(texts).length > MAX_KEYS) throw new HttpError(400, `Use at most ${MAX_KEYS} texts.`);

  res.json(must(await supabaseAdmin.from('ui_text').update({ texts }).eq('id', 1).select().single()));
}));

export default router;
