import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../../lib/api.js';

export default function Login() {
  const { session, loading, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <div className="admin-boot">Loading…</div>;
  if (session && !busy) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: authError } = await signIn(email.trim(), password);
    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message);
      setBusy(false);
      return;
    }

    // Confirm the server accepts this account as the admin.
    try {
      await api.get('/admin/stats');
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      await signOut();
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login-form" onSubmit={submit}>
        <h1 className="admin-title">Sign in</h1>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        <div className="admin-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="admin-button" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a className="admin-small admin-muted" href="/">Back to site</a>
      </form>
    </div>
  );
}
