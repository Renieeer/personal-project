import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy server/.env.example to server/.env and fill it in.');
}

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Service-role client: bypasses RLS. Never send this key to the browser.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options);

// A throwaway client for operations that create a session (e.g. verifying a
// password), so the shared admin client never holds a user session.
export function createIsolatedClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options);
}
