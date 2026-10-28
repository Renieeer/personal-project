import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler, must } from '../lib/http.js';
import { t, validate } from '../lib/validate.js';

export const SECTION_KEYS = [
  'hero', 'about', 'skills', 'experience', 'education',
  'projects', 'certificates', 'testimonials', 'contact',
];

const schema = {
  title: t.text({ max: 120, notNull: true }),
  intro: t.text({ max: 1000 }),
  is_visible: t.bool(),
};

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(must(await supabaseAdmin.from('section_visibility').select('*').order('sort_order')));
}));

router.put('/reorder', asyncHandler(async (req, res) => {
  const keys = req.body?.keys;
  if (!Array.isArray(keys) || !keys.length || !keys.every((key) => SECTION_KEYS.includes(key))) {
    throw new HttpError(400, 'keys must be an array of section keys.');
  }
  await Promise.all(keys.map((key, index) =>
    supabaseAdmin.from('section_visibility').update({ sort_order: index }).eq('key', key).then(must)));
  res.json({ ok: true });
}));

router.put('/:key', asyncHandler(async (req, res) => {
  if (!SECTION_KEYS.includes(req.params.key)) throw new HttpError(404, 'Unknown section.');
  const data = validate(schema, req.body, { partial: true });
  if (!Object.keys(data).length) throw new HttpError(400, 'Nothing to update.');
  const row = must(await supabaseAdmin.from('section_visibility').update(data).eq('key', req.params.key).select().maybeSingle());
  if (!row) throw new HttpError(404, 'Section not found. Run supabase/migrations.sql to create it.');
  res.json(row);
}));

export default router;
