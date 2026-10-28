import express from 'express';
import { supabaseAdmin, createIsolatedClient } from '../lib/supabase.js';
import { HttpError, asyncHandler } from '../lib/http.js';

const router = express.Router();

router.post('/password', asyncHandler(async (req, res) => {
  const { current_password: currentPassword, new_password: newPassword } = req.body || {};

  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new HttpError(400, 'Please check the highlighted fields.', { current_password: 'Required.' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 72) {
    throw new HttpError(400, 'Please check the highlighted fields.', { new_password: 'Must be 8 to 72 characters.' });
  }
  if (newPassword === currentPassword) {
    throw new HttpError(400, 'Please check the highlighted fields.', { new_password: 'Must differ from the current password.' });
  }

  // Verify the current password with a separate client so no session leaks into the shared one.
  const verifier = createIsolatedClient();
  const { error: signInError } = await verifier.auth.signInWithPassword({ email: req.user.email, password: currentPassword });
  if (signInError) {
    throw new HttpError(400, 'Please check the highlighted fields.', { current_password: 'Incorrect password.' });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: newPassword });
  if (error) throw new HttpError(400, error.message);

  res.json({ ok: true });
}));

export default router;
