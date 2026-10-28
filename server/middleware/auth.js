import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler } from '../lib/http.js';

// Verifies the Supabase JWT sent as "Authorization: Bearer <token>" and
// checks that it belongs to the configured admin account.
export const requireAdmin = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Missing access token.');

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
  if ((data.user.email || '').toLowerCase() !== adminEmail) {
    throw new HttpError(403, 'This account does not have admin access.');
  }

  req.user = data.user;
  next();
});
