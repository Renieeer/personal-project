import { useEffect, useRef, useState } from 'react';
import { Field, toFormValues } from '../components/Field.jsx';
import FileField from '../components/FileField.jsx';
import { UI_TEXT_DEFAULTS } from '../../lib/uiText.js';
import { useStore } from './store.js';
import { fileKey, findRow, isTemp, rowKey } from './model.js';
import { SECTION_NAMES, SINGLETONS, UI_TEXT_GROUPS, configFor } from './schema.js';

// Form value (always a string or boolean) -> draft value, like toPayload in Field.jsx.
function toValue(field, value) {
  if (field.type === 'tags') return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'number' || field.numeric) {
    if (value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value === '' ? null : value;
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function PanelFile({ table, id, file, row }) {
  const store = useStore();
  const ref = { table, id, field: file.name };
  const change = store.state.files[fileKey(table, id, file.name)];
  const error = store.state.errors[rowKey(table, id)]?.details?.[file.name];
  // A new gallery image is its file; remove the image itself instead.
  const removable = table !== 'project_images';

  return (
    <div>
      <FileField
        file={file}
        url={change?.remove ? null : row[`${file.name}_url`]}
        pendingFile={change?.file}
        busy={false}
        onSelect={(selected) => store.setFile(ref, file, selected)}
        onRemove={removable ? () => store.removeFile(ref) : undefined}
      />
      {change?.remove && <p className="admin-hint">Removed. The file is deleted from storage when you save.</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}

function RowForm({ table, id, onClose }) {
  const store = useStore();
  const { draft, errors } = store.state;
  const row = findRow(draft, table, id);
  const config = configFor(table, {
    categories: draft.skill_categories.map((c) => ({ ...c, name: c.name || 'Untitled category' })),
  });
  const { fields } = config;
  const [values, setValues] = useState(() => toFormValues(fields, row || {}));

  // Follow changes made elsewhere (on the page, undo) without disturbing typing here.
  useEffect(() => {
    if (!row) {
      onClose();
      return;
    }
    setValues((prev) => {
      let next = prev;
      for (const field of fields) {
        if (!same(toValue(field, prev[field.name]), row[field.name])) {
          next = { ...next, [field.name]: toFormValues([field], row)[field.name] };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  if (!row) return null;

  const rowErrors = errors[rowKey(table, id)];
  const list = !SINGLETONS.includes(table);
  const change = (field, value) => {
    setValues((prev) => ({ ...prev, [field.name]: value }));
    store.setValue({ table, id, field: field.name }, toValue(field, value), { coalesce: `${rowKey(table, id)}:${field.name}` });
  };

  return (
    <div className="admin-form">
      {rowErrors && <p className="admin-alert" role="alert">{rowErrors.message}</p>}
      {isTemp(id) && <p className="admin-notice">New {config.singular}. It is added to the site when you save.</p>}
      <div className="admin-field-grid">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            error={rowErrors?.details?.[field.name]}
            onChange={(value) => change(field, value)}
          />
        ))}
      </div>
      {list && (
        <label className="admin-check" htmlFor="ed-visible">
          <input
            id="ed-visible"
            type="checkbox"
            checked={row.is_visible !== false}
            onChange={(event) => store.setValue({ table, id, field: 'is_visible' }, event.target.checked)}
          />
          Show on the site
        </label>
      )}
      {config.files?.length > 0 && (
        <div className="admin-files">
          {config.files.map((file) => <PanelFile key={file.name} table={table} id={id} file={file} row={row} />)}
        </div>
      )}
      {table === 'projects' && (
        <div className="ed-panel-note">
          <p className="admin-muted admin-small">Gallery images are edited on the project page.</p>
          <button
            type="button"
            className="admin-button admin-button--ghost admin-button--small"
            onClick={() => {
              store.openProject(id);
              onClose();
            }}
          >
            Open project page
          </button>
        </div>
      )}
      {list && table !== 'sections' && (
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-button admin-button--danger admin-button--small"
            onClick={() => {
              if (window.confirm(`Delete this ${config.singular}? You can undo this until you save.`)) store.remove(table, id);
            }}
          >
            Delete {config.singular}
          </button>
        </div>
      )}
    </div>
  );
}

function UiTextField({ name, label, value, error }) {
  const store = useStore();
  const [text, setText] = useState(value);
  const id = `ui-${name}`;

  // The draft stores trimmed text and no override for the default.
  useEffect(() => {
    setText((prev) => {
      const stored = prev.trim() === UI_TEXT_DEFAULTS[name] ? '' : prev.trim();
      return stored === value ? prev : value;
    });
  }, [name, value]);

  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={text}
        placeholder={UI_TEXT_DEFAULTS[name]}
        maxLength={300}
        aria-invalid={error ? 'true' : undefined}
        onChange={(event) => {
          setText(event.target.value);
          store.setValue({ table: 'ui', id: null, field: name }, event.target.value, { coalesce: `ui:${name}` });
        }}
      />
      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}

function UiTextForm() {
  const { state } = useStore();
  if (state.uiTextError) {
    return (
      <p className="admin-alert" role="alert">
        Site text can't be edited yet. {state.uiTextError}
      </p>
    );
  }
  const texts = state.draft.ui_text.texts || {};
  const fieldErrors = state.errors[rowKey('ui', null)]?.details || {};

  return (
    <div className="admin-form">
      <p className="admin-muted admin-small">Buttons, labels and messages around your content. Leave a field empty to use the default shown in grey.</p>
      {state.errors[rowKey('ui', null)] && <p className="admin-alert" role="alert">{state.errors[rowKey('ui', null)].message}</p>}
      {UI_TEXT_GROUPS.map((group) => (
        <fieldset key={group.title} className="ed-fieldset">
          <legend className="admin-label">{group.title}</legend>
          {Object.entries(group.items).map(([key, label]) => (
            <UiTextField key={key} name={key} label={label} value={texts[key] || ''} error={fieldErrors[key]} />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function panelTitle(table, id, draft) {
  if (table === 'ui') return 'Site text';
  if (table === 'profile') return 'Profile';
  if (table === 'settings') return 'Site settings';
  if (table === 'sections') return `${SECTION_NAMES[id]} section`;
  const config = configFor(table);
  const row = findRow(draft, table, id);
  const name = row && config.itemLabel?.(row);
  const kind = `${config.singular[0].toUpperCase()}${config.singular.slice(1)}`;
  return name ? `${kind}: ${name}` : kind;
}

// Full form for one item, a section, the profile, settings or the site text.
// Changes show on the page as you type and are saved with the rest.
export default function SidePanel({ target, onClose }) {
  const store = useStore();
  const panelRef = useRef(null);
  const { table, id } = target;

  useEffect(() => {
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = (target.focus && panel.querySelector(`#field-${target.focus}`))
      || panel.querySelector('.ed-panel-body input, .ed-panel-body textarea, .ed-panel-body select');
    first?.focus();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      ref={panelRef}
      className="ed-panel"
      aria-labelledby="ed-panel-title"
      inert={store.state.saving ? '' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="ed-panel-head">
        <h2 id="ed-panel-title" className="admin-subtitle">{panelTitle(table, id, store.state.draft)}</h2>
        <button type="button" className="admin-link-button" onClick={onClose}>Close</button>
      </header>
      <div className="ed-panel-body">
        {table === 'ui' ? <UiTextForm /> : <RowForm table={table} id={id} onClose={onClose} />}
      </div>
    </aside>
  );
}
