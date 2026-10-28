import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { FieldGrid, toFormValues, toPayload } from './Field.jsx';
import FileField from './FileField.jsx';

// Editor for single-row tables (profile, settings). Files upload immediately.
export default function SingletonEditor({ config }) {
  const base = `/admin/${config.endpoint}`;
  const [row, setRow] = useState(null);
  const [values, setValues] = useState(() => toFormValues(config.fields));
  const [status, setStatus] = useState('loading');
  const [saving, setSaving] = useState(false);
  const [busyFile, setBusyFile] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(base)
      .then((data) => {
        if (!active) return;
        setRow(data);
        setValues(toFormValues(config.fields, data));
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [base, config.fields]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);
    try {
      const saved = await api.put(base, toPayload(config.fields, values));
      setRow(saved);
      setValues(toFormValues(config.fields, saved));
      setNotice('Saved.');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details || {});
    } finally {
      setSaving(false);
    }
  };

  const upload = async (field, file) => {
    setBusyFile(field);
    setError(null);
    setNotice(null);
    try {
      setRow(await api.upload(`${base}/files/${field}`, { file }));
      setNotice('File uploaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFile(null);
    }
  };

  const remove = async (field) => {
    if (!window.confirm('Remove this file? It will be deleted from storage.')) return;
    setBusyFile(field);
    setError(null);
    try {
      setRow(await api.del(`${base}/files/${field}`));
      setNotice('File removed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFile(null);
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1 className="admin-title">{config.title}</h1>
          {config.description && <p className="admin-muted">{config.description}</p>}
        </div>
        {config.panel && (
          <Link className="admin-button admin-button--ghost" to={`/admin/editor?panel=${config.panel}`}>Edit on the live page</Link>
        )}
      </header>

      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {status === 'loading' && <p className="admin-muted">Loading…</p>}

      {status === 'ready' && (
        <div className="admin-editor">
          <form className="admin-form" onSubmit={submit}>
            <FieldGrid fields={config.fields} values={values} setValues={setValues} errors={fieldErrors} disabled={saving} />
            <div className="admin-form-actions">
              <button type="submit" className="admin-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
          {config.files?.length > 0 && (
            <div className="admin-files admin-files--separate">
              <h2 className="admin-subtitle">Files</h2>
              <p className="admin-muted admin-small">Files upload as soon as you choose them.</p>
              {config.files.map((file) => (
                <FileField
                  key={file.name}
                  file={file}
                  url={row?.[`${file.name}_url`]}
                  busy={busyFile === file.name}
                  onSelect={(selected) => upload(file.name, selected)}
                  onRemove={() => remove(file.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
