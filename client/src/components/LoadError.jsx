import { isSupabaseConfigured } from '../lib/supabase.js';
import { useText } from '../lib/uiText.js';

export default function LoadError() {
  const text = useText();
  return (
    <div className="container status-page">
      <h1 className="status-title">{text('load_error_title')}</h1>
      <p className="muted">
        {isSupabaseConfigured
          ? text('load_error_body')
          : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env, then restart the dev server.'}
      </p>
    </div>
  );
}
