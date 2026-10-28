import { useState } from 'react';
import { api } from '../../lib/api.js';

const EMPTY = { current_password: '', new_password: '', confirm_password: '' };

export default function PasswordPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (event) => setValues({ ...values, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setError(null);
    setNotice(null);
    if (values.new_password !== values.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }
    setBusy(true);
    try {
      await api.post('/admin/account/password', {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      setValues(EMPTY);
      setNotice('Password changed.');
    } catch (err) {
      setError(err.message);
      setErrors(err.details || {});
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, autoComplete, hint) => (
    <div className="admin-field">
      <label htmlFor={`pw-${name}`}>{label}</label>
      <input
        id={`pw-${name}`}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        minLength={name === 'current_password' ? undefined : 8}
        maxLength={72}
        value={values[name]}
        onChange={update}
        aria-invalid={errors[name] ? 'true' : undefined}
      />
      {hint && <p className="admin-hint">{hint}</p>}
      {errors[name] && <p className="admin-error">{errors[name]}</p>}
    </div>
  );

  return (
    <section className="admin-panel admin-narrow">
      <h1 className="admin-title">Change password</h1>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <form className="admin-form" onSubmit={submit}>
        {field('current_password', 'Current password', 'current-password')}
        {field('new_password', 'New password', 'new-password', 'At least 8 characters.')}
        {field('confirm_password', 'Confirm new password', 'new-password')}
        <div className="admin-form-actions">
          <button type="submit" className="admin-button" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  );
}
