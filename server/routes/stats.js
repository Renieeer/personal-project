import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler, must, toHttpError } from '../lib/http.js';

const router = express.Router();

async function count(table, filter) {
  let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count: total, error } = await query;
  if (error) throw toHttpError(error);
  return total ?? 0;
}

router.get('/', asyncHandler(async (req, res) => {
  const [projects, messages, unread, skills, experience, testimonials, certificates] = await Promise.all([
    count('projects'),
    count('messages'),
    count('messages', (q) => q.eq('is_read', false)),
    count('skills'),
    count('experience'),
    count('testimonials'),
    count('certificates'),
  ]);
  const recentMessages = must(await supabaseAdmin.from('messages')
    .select('id, name, subject, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(5));

  res.json({
    counts: { projects, messages, unread, skills, experience, testimonials, certificates },
    recent_messages: recentMessages,
  });
}));

export default router;
