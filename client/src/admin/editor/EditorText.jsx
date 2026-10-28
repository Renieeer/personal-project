import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { paragraphs } from '../../lib/format.js';
import { UI_TEXT_DEFAULTS } from '../../lib/uiText.js';
import { useStore } from './store.js';
import { getValue, parseAt, rowKey } from './model.js';
import { fieldSpec } from './schema.js';

// Not every browser supports contenteditable="plaintext-only"; the fallback
// keeps formatting out by handling paste and shortcuts below.
const PLAINTEXT_ONLY = (() => {
  try {
    const el = document.createElement('span');
    el.contentEditable = 'plaintext-only';
    return el.contentEditable === 'plaintext-only';
  } catch {
    return false;
  }
})();

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

function ErrorTip({ children }) {
  return <span className="ed-error-tip ed-ui" role="alert">{children}</span>;
}

// Single-line text edited in place. Enter or leaving the field keeps the
// change, Escape restores the text from before.
function InlineText({ at, value, label, error, onCommit }) {
  const elRef = useRef(null);
  const before = useRef(value);
  const [inButton, setInButton] = useState(false);
  const [popover, setPopover] = useState(false);

  // Text inside a button cannot be edited in place in every browser, so it
  // opens a small popover instead.
  useLayoutEffect(() => {
    if (elRef.current?.parentElement?.closest('button')) setInButton(true);
  }, []);

  // React does not render the text of the editable span; it is set here
  // whenever it changes while the span is not being edited.
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el || inButton) return;
    if (document.activeElement !== el && el.textContent !== value) el.textContent = value;
  });

  if (inButton) {
    return (
      <>
        <span
          key="button"
          ref={elRef}
          className="ed-text ed-text--button"
          data-ed-at={at}
          data-error={error ? '' : undefined}
          title={`Edit: ${label}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setPopover(true);
          }}
        >
          {value || <span className="ed-placeholder">{label}</span>}
        </span>
        {popover && (
          <TextPopover anchor={elRef.current} value={value} label={label} onCommit={onCommit} onClose={() => setPopover(false)} />
        )}
        {error && <ErrorTip>{error}</ErrorTip>}
      </>
    );
  }

  const commit = () => {
    const el = elRef.current;
    const text = collapse(el.textContent);
    if (text !== value) onCommit(text);
    else el.textContent = value;
  };

  return (
    <>
      <span
        key="inline"
        ref={elRef}
        className="ed-text"
        contentEditable={PLAINTEXT_ONLY ? 'plaintext-only' : 'true'}
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        spellCheck
        data-placeholder={label}
        data-ed-at={at}
        data-error={error ? '' : undefined}
        onFocus={() => {
          before.current = elRef.current.textContent;
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          const el = elRef.current;
          if (event.key === 'Enter') {
            event.preventDefault();
            el.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            el.textContent = before.current;
            el.blur();
          } else if ((event.ctrlKey || event.metaKey) && ['b', 'i', 'u'].includes(event.key.toLowerCase())) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand('insertText', false, event.clipboardData.getData('text/plain').replace(/\s+/g, ' '));
        }}
        onDrop={(event) => event.preventDefault()}
      />
      {error && <ErrorTip>{error}</ErrorTip>}
    </>
  );
}

function TextPopover({ anchor, value, label, onCommit, onClose }) {
  const [text, setText] = useState(value);
  const closed = useRef(false);
  const rect = anchor.getBoundingClientRect();
  const style = {
    top: Math.min(rect.bottom + 8, window.innerHeight - 110),
    left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
  };

  const close = (save) => {
    if (closed.current) return;
    closed.current = true;
    if (save && collapse(text) !== value) onCommit(collapse(text));
    onClose();
  };

  return createPortal(
    <div className="ed-popover ed-ui" style={style} role="dialog" aria-label={`Edit ${label}`}>
      <label className="ed-popover-label" htmlFor="ed-popover-input">{label}</label>
      <input
        id="ed-popover-input"
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => close(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            close(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close(false);
          }
        }}
      />
    </div>,
    document.body,
  );
}

// Multi-paragraph text. Shown exactly like the site renders it; a click
// turns it into a textarea until it loses focus.
function BlockText({ at, value, label, className, error, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const areaRef = useRef(null);
  const finished = useRef(false);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight + 2}px`;
  }, [text, editing]);

  const start = () => {
    finished.current = false;
    setText(value);
    setEditing(true);
  };

  const finish = (save) => {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
    const next = text.replace(/\r\n/g, '\n').trim();
    if (save && next !== value) onCommit(next);
  };

  if (editing) {
    return (
      <div className={`${className} ed-block is-editing`}>
        <textarea
          ref={areaRef}
          className="ed-textarea"
          value={text}
          autoFocus
          aria-label={label}
          data-ed-at={at}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              finish(false);
            } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              finish(true);
            }
          }}
        />
        <span className="ed-hint ed-ui">A blank line starts a new paragraph. Ctrl+Enter to finish, Esc to cancel.</span>
      </div>
    );
  }

  const parts = paragraphs(value);
  return (
    <>
      <div
        className={`${className} ed-block`}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${label}`}
        data-ed-at={at}
        data-error={error ? '' : undefined}
        onClick={start}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            start();
          }
        }}
      >
        {parts.length ? parts.map((part, i) => <p key={i}>{part}</p>) : <p className="ed-placeholder">{label}</p>}
      </div>
      {error && <ErrorTip>{error}</ErrorTip>}
    </>
  );
}

// Values edited in the side panel (dates, tags): shown as on the site, a
// click opens the panel at that field.
function PanelText({ target, children, label, error }) {
  const { openPanel } = useStore();
  const open = (event) => {
    event.preventDefault();
    event.stopPropagation();
    openPanel(target);
  };
  const empty = children === null || children === undefined || children === '';
  return (
    <>
      <span
        className="ed-text ed-text--panel"
        role="button"
        tabIndex={0}
        title="Edit in the details panel"
        onClick={open}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && open(event)}
      >
        {empty ? <span className="ed-placeholder">{label}</span> : children}
      </span>
      {error && <ErrorTip>{error}</ErrorTip>}
    </>
  );
}

export default function EditorText({ at, children, block = false, panel = false, className = '', placeholder }) {
  const store = useStore();
  const ref = parseAt(at);
  const label = placeholder || (ref.table === 'ui' ? UI_TEXT_DEFAULTS[ref.field] : fieldSpec(ref.table, ref.field)?.label) || 'Text';
  const error = store.state.errors[rowKey(ref.table, ref.id)]?.details?.[ref.field];

  if (panel) {
    return (
      <PanelText target={{ table: ref.table, id: ref.id, focus: ref.field }} label={label} error={error}>
        {children}
      </PanelText>
    );
  }
  // Without the ui_text table the texts show their defaults but cannot be changed.
  if (ref.table === 'ui' && store.state.uiTextError) return children ?? null;

  const raw = getValue(store.state.draft, ref);
  const value = raw === null || raw === undefined ? '' : String(raw);
  const commit = (text) => store.setValue(ref, text === '' ? null : text);

  if (block) {
    return <BlockText at={at} value={value} label={label} className={className} error={error} onCommit={commit} />;
  }
  return <InlineText at={at} value={value} label={label} error={error} onCommit={commit} />;
}
