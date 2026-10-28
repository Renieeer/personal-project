import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler, must } from '../lib/http.js';
import { t, validate } from '../lib/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const contactSchema = {
  name: t.text({ required: true, max: 100 }),
  email: t.email({ required: true, max: 200 }),
  subject: t.text({ max: 200 }),
  message: t.text({ required: true, max: 5000 }),
};

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many messages. Please try again later.',
});

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.post('/contact', contactLimiter, asyncHandler(async (req, res) => {
  // Honeypot: real visitors never fill the hidden "website" field.
  if (req.body?.website) return res.status(201).json({ ok: true });

  const data = validate(contactSchema, req.body);
  must(await supabaseAdmin.from('messages').insert({
    name: data.name,
    email: data.email,
    subject: data.subject,
    body: data.message,
  }));
  res.status(201).json({ ok: true });
}));

export default router;
