import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import SortableList from '../components/SortableList.jsx';
import { SECTION_NAMES } from '../resources.js';

function SectionRow({ section, onSaved }) {
  const [title, setTitle] = useState(section.title);
  const [intro, setIntro] = useState(section.intro || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dirty = title !== section.title || intro !== (section.intro || '');

  const save = async (patch) => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.put(`/admin/sections/${section.key}`, patch));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`admin-section-row${section.is_visible ? '' : ' is-hidden'}`}>
      <div className="admin-section-row-head">
        <strong>{SECTION_NAMES[section.key]}</strong>
        <button
          type="button"
          className={`admin-toggle${section.is_visible ? ' is-on' : ''}`}
          aria-pressed={section.is_visible}
          disabled={busy}
          onClick={() => save({ is_visible: !section.is_visible })}
        >
          {section.is_visible ? 'Visible' : 'Hidden'}
        </button>
      </div>
      {section.key !== 'hero' && (
        <div className="admin-field-grid">
          <div className="admin-field">
            <label htmlFor={`section-title-${section.key}`}>Heading (also used in the menu)</label>
            <input id={`section-title-${section.key}`} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="admin-field">
            <label htmlFor={`section-intro-${section.key}`}>Intro line</label>
            <input id={`section-intro-${section.key}`} value={intro} maxLength={1000} onChange={(e) => setIntro(e.target.value)} />
          </div>
        </div>
      )}
      {error && <p className="admin-error">{error}</p>}
      {dirty && (
        <div className="admin-form-actions">
          <button type="button" className="admin-button admin-button--small" disabled={busy} onClick={() => save({ title, intro })}>
            Save
          </button>
          <button
            type="button"
            className="admin-link-button"
            onClick={() => {
              setTitle(section.title);
              setIntro(section.intro || '');
            }}
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/sections')
      .then((data) => {
        setSections(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const reorder = async (next) => {
    const previous = sections;
    setSections(next);
    setError(null);
    try {
      await api.put('/admin/sections/reorder', { keys: next.map((s) => s.key) });
    } catch (err) {
      setSections(previous);
      setError(err.message);
    }
  };

  const replace = (updated) => setSections((prev) => prev.map((s) => (s.key === updated.key ? updated : s)));

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1 className="admin-title">Sections</h1>
          <p className="admin-muted">
            Show, hide and reorder the sections of the home page. A visible section with no content is not shown.
          </p>
        </div>
        <Link className="admin-button admin-button--ghost" to="/admin/editor">Edit on the live page</Link>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {status === 'loading' && <p className="admin-muted">Loading…</p>}
      {status === 'ready' && (
        <SortableList
          items={sections}
          getKey={(s) => s.key}
          onReorder={reorder}
          renderItem={(section) => <SectionRow section={section} onSaved={replace} />}
        />
      )}
    </section>
  );
}
