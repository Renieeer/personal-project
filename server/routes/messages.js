import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler, must, parseId } from '../lib/http.js';
import { t, validate } from '../lib/validate.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(must(await supabaseAdmin.from('messages').select('*').order('created_at', { ascending: false })));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validate({ is_read: t.bool({ required: true }) }, req.body);
  const row = must(await supabaseAdmin.from('messages').update(data).eq('id', id).select().maybeSingle());
  if (!row) throw new HttpError(404, 'Message not found.');
  res.json(row);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const rows = must(await supabaseAdmin.from('messages').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(404, 'Message not found.');
  res.json({ ok: true });
}));

export default router;
