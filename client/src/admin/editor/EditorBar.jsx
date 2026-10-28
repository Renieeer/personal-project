import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

// Sticky bar above the preview: page switcher, panels, undo/redo and saving.
export default function EditorBar({
  barRef, projects, projectId, onPage, openPanel,
  changes, errorCount, saving, canUndo, canRedo,
  onUndo, onRedo, onSave, onDiscard, onLeave, onShowErrors,
}) {
  let status = 'All changes saved';
  if (saving) status = 'Saving…';
  else if (changes) status = `${changes} unsaved change${changes === 1 ? '' : 's'}`;

  return (
    <header ref={barRef} className="ed-bar">
      <div className="ed-bar-group">
        <Link to="/admin" className="ed-bar-link" onClick={onLeave}>← Admin</Link>
        <select
          className="ed-bar-select"
          aria-label="Page to edit"
          value={projectId ?? ''}
          onChange={(event) => onPage(event.target.value === '' ? null : Number(event.target.value))}
        >
          <option value="">Home page</option>
          {projects.length > 0 && (
            <optgroup label="Project pages">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title || 'Untitled project'}</option>
              ))}
            </optgroup>
          )}
        </select>
        <button type="button" className="ed-bar-button" onClick={() => openPanel({ table: 'profile', id: null })}>Profile</button>
        <button type="button" className="ed-bar-button" onClick={() => openPanel({ table: 'settings', id: null })}>Settings</button>
        <button type="button" className="ed-bar-button" onClick={() => openPanel({ table: 'ui', id: null })}>Site text</button>
        <a className="ed-bar-link" href="/" target="_blank" rel="noreferrer">View site</a>
      </div>

      <div className="ed-bar-group ed-bar-group--save">
        <button type="button" className="ed-bar-icon" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo || saving} onClick={onUndo}>
          <Icon name="undo" />
        </button>
        <button type="button" className="ed-bar-icon" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo || saving} onClick={onRedo}>
          <Icon name="redo" />
        </button>
        <span className="ed-bar-status" role="status" aria-live="polite">{status}</span>
        {errorCount > 0 && !saving && (
          <button type="button" className="ed-bar-error" onClick={onShowErrors}>
            {errorCount} {errorCount === 1 ? 'problem' : 'problems'}
          </button>
        )}
        <button type="button" className="ed-bar-button" disabled={!changes || saving} onClick={onDiscard}>Discard</button>
        <button type="button" className="ed-bar-button ed-bar-primary" disabled={!changes || saving} onClick={onSave} title="Save (Ctrl+S)">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </header>
  );
}
