import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { FieldGrid, toFormValues, toPayload } from './Field.jsx';
import FileField from './FileField.jsx';
import SortableList from './SortableList.jsx';

function ItemForm({ config, fields, item, defaults, onSaved, onFileChange, onCancel }) {
  const [row, setRow] = useState(item.id ? item : null);
  const [values, setValues] = useState(() => toFormValues(fields, item.id ? item : defaults));
  const [pending, setPending] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyFile, setBusyFile] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const files = config.files || [];
  const base = `/admin/${config.endpoint}`;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const isNew = !row;
    try {
      let saved = isNew
        ? await api.post(base, toPayload(fields, values))
        : await api.put(`${base}/${row.id}`, toPayload(fields, values));
      setRow(saved);
      for (const [field, file] of Object.entries(pending)) {
        saved = await api.upload(`${base}/${saved.id}/files/${field}`, { file });
        setPending((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      onSaved(saved, isNew);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details || {});
    } finally {
      setSaving(false);
    }
  };

  const selectFile = async (field, file) => {
    if (!row) {
      setPending((prev) => ({ ...prev, [field]: file }));
      return;
    }
    setBusyFile(field);
    setError(null);
    try {
      const updated = await api.upload(`${base}/${row.id}/files/${field}`, { file });
      setRow(updated);
      onFileChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFile(null);
    }
  };

  const removeFile = async (field) => {
    if (pending[field]) {
      setPending((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }
    if (!window.confirm('Remove this file? It will be deleted from storage.')) return;
    setBusyFile(field);
    try {
      const updated = await api.del(`${base}/${row.id}/files/${field}`);
      setRow(updated);
      onFileChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFile(null);
    }
  };

  const Extra = config.Extra;

  return (
    <div className="admin-editor">
      <form className="admin-form" onSubmit={submit}>
        <h3 className="admin-editor-title">{row ? `Edit ${config.singular}` : `New ${config.singular}`}</h3>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        <FieldGrid fields={fields} values={values} setValues={setValues} errors={fieldErrors} disabled={saving} />
        {files.length > 0 && (
          <div className="admin-files">
            {files.map((file) => (
              <FileField
                key={file.name}
                file={file}
                url={row?.[`${file.name}_url`]}
                pendingFile={pending[file.name]}
                busy={busyFile === file.name || saving}
                onSelect={(selected) => selectFile(file.name, selected)}
                onRemove={() => removeFile(file.name)}
              />
            ))}
          </div>
        )}
        <div className="admin-form-actions">
          <button type="submit" className="admin-button" disabled={saving}>
            {saving ? 'Saving…' : row ? 'Save changes' : `Create ${config.singular}`}
          </button>
          <button type="button" className="admin-button admin-button--ghost" onClick={onCancel} disabled={saving}>
            {row ? 'Close' : 'Cancel'}
          </button>
        </div>
      </form>
      {Extra && row && <Extra row={row} />}
    </div>
  );
}

/**
 * Generic list editor: create, edit, delete, reorder and toggle visibility.
 * Props: config (see admin/resources.js), context (passed to config.fields),
 * query (list filter), defaults (initial values for new items),
 * onItemsChange (notified with the current list), heading ('h1' | 'h2').
 */
export default function CollectionEditor({ config, context = {}, query, defaults = {}, onItemsChange, heading = 'h2' }) {
  const fields = typeof config.fields === 'function' ? config.fields(context) : config.fields;
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const queryString = new URLSearchParams(query || {}).toString();
  const listPath = `/admin/${config.endpoint}${queryString ? `?${queryString}` : ''}`;
  const Heading = heading;

  const load = useCallback(async () => {
    try {
      setItems(await api.get(listPath));
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [listPath]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  const upsert = (row) => setItems((prev) => (prev.some((item) => item.id === row.id)
    ? prev.map((item) => (item.id === row.id ? row : item))
    : [...prev, row]));

  const handleSaved = (row, isNew) => {
    upsert(row);
    if (query) load();
    if (isNew && config.Extra) {
      setEditing(row);
      setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} created. You can now add more below.`);
    } else {
      setEditing(null);
      setNotice(isNew ? 'Created.' : 'Saved.');
    }
  };

  const reorder = async (next) => {
    const previous = items;
    setItems(next);
    setError(null);
    try {
      await api.put(`/admin/${config.endpoint}/reorder`, { ids: next.map((item) => item.id) });
    } catch (err) {
      setItems(previous);
      setError(err.message);
    }
  };

  const toggleVisible = async (item) => {
    setError(null);
    try {
      upsert(await api.put(`/admin/${config.endpoint}/${item.id}`, { is_visible: !item.is_visible }));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    const label = config.itemLabel(item);
    if (!window.confirm(`Delete "${label}"? This also deletes its files and cannot be undone.`)) return;
    setError(null);
    try {
      await api.del(`/admin/${config.endpoint}/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (editing?.id === item.id) setEditing(null);
      setNotice('Deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <Heading className={heading === 'h1' ? 'admin-title' : 'admin-subtitle'}>{config.title}</Heading>
          {config.description && <p className="admin-muted">{config.description}</p>}
        </div>
        <div className="admin-panel-actions">
          {config.section && heading === 'h1' && (
            <Link className="admin-button admin-button--ghost" to={`/admin/editor?section=${config.section}`}>Edit on the live page</Link>
          )}
          {!editing?.isNew && (
            <button
              type="button"
              className="admin-button"
              onClick={() => {
                setNotice(null);
                setEditing({ isNew: true });
              }}
            >
              Add {config.singular}
            </button>
          )}
        </div>
      </header>

      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      {editing && (
        <ItemForm
          key={editing.id ?? 'new'}
          config={config}
          fields={fields}
          item={editing}
          defaults={defaults}
          onSaved={handleSaved}
          onFileChange={upsert}
          onCancel={() => setEditing(null)}
        />
      )}

      {status === 'loading' && <p className="admin-muted">Loading…</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="admin-empty">Nothing here yet. This section stays hidden on the site until it has items.</p>
      )}
      {status === 'ready' && items.length > 0 && (
        <SortableList
          items={items}
          getKey={(item) => item.id}
          onReorder={reorder}
          renderItem={(item) => (
            <div className={`admin-row${item.is_visible ? '' : ' is-hidden'}${editing?.id === item.id ? ' is-editing' : ''}`}>
              {config.thumb && (
                item[config.thumb]
                  ? <img className="admin-row-thumb" src={item[config.thumb]} alt="" loading="lazy" />
                  : <span className="admin-row-thumb admin-row-thumb--empty" />
              )}
              <div className="admin-row-text">
                <strong>{config.itemLabel(item)}</strong>
                {config.itemMeta && <span className="admin-muted admin-small">{config.itemMeta(item)}</span>}
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className={`admin-toggle${item.is_visible ? ' is-on' : ''}`}
                  aria-pressed={item.is_visible}
                  onClick={() => toggleVisible(item)}
                >
                  {item.is_visible ? 'Visible' : 'Hidden'}
                </button>
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() => {
                    setNotice(null);
                    setEditing(item);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="admin-link-button admin-danger-text" onClick={() => remove(item)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}
    </section>
  );
}
