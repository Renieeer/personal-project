import { useEffect, useRef, useState } from 'react';
import { useStore } from './store.js';
import { findRow, groupRows, isTemp, parseAt, rowKey } from './model.js';
import { LABEL_FIELD, configFor, groupOf } from './schema.js';
import Icon from './Icon.jsx';

// The row being dragged. Drops are accepted by rows of the same table and group.
let activeDrag = null;

const CHILDREN_NOTE = {
  skill_categories: ' This also deletes its skills.',
  projects: ' This also deletes its gallery images.',
};

function ToolButton({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      className={`ed-tool${danger ? ' ed-tool--danger' : ''}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

// Toolbar for one row, placed inside the element that shows the row (its
// "host"). The host is also where other rows can be dropped when dragging.
export default function EditorItem({ at }) {
  const store = useStore();
  const { table, id } = parseAt(at);
  const markerRef = useRef(null);
  // Touch screens have no hover: the tools open from a "•••" button instead.
  const [open, setOpen] = useState(false);
  const row = findRow(store.state.draft, table, id);
  const group = row ? groupOf(table, row) : null;
  const { move } = store;

  useEffect(() => {
    const host = markerRef.current?.parentElement;
    if (!host) return undefined;
    const accepts = () => activeDrag && activeDrag.table === table && activeDrag.group === group && activeDrag.id !== id;
    const onOver = (event) => {
      if (!accepts()) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'move';
      const rect = host.getBoundingClientRect();
      host.dataset.edDrop = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    };
    const onLeave = (event) => {
      if (!host.contains(event.relatedTarget)) delete host.dataset.edDrop;
    };
    const onDrop = (event) => {
      if (!accepts() || !host.dataset.edDrop) return;
      event.preventDefault();
      event.stopPropagation();
      move(table, activeDrag.id, id, host.dataset.edDrop);
      delete host.dataset.edDrop;
    };
    host.addEventListener('dragover', onOver);
    host.addEventListener('dragleave', onLeave);
    host.addEventListener('drop', onDrop);
    return () => {
      host.removeEventListener('dragover', onOver);
      host.removeEventListener('dragleave', onLeave);
      host.removeEventListener('drop', onDrop);
      delete host.dataset.edDrop;
    };
  }, [table, id, group, move]);

  if (!row) return null;

  const config = configFor(table);
  const name = config.itemLabel?.(row) || `this ${config.singular}`;
  const hidden = row.is_visible === false;
  const error = store.state.errors[rowKey(table, id)];
  const siblings = groupRows(store.state.draft[table], table, group);
  const index = siblings.indexOf(row);
  const canAdd = table !== 'project_images';

  const openDetails = () => store.openPanel({ table, id });

  return (
    <span
      ref={markerRef}
      className="ed-item ed-ui"
      data-hidden={hidden || undefined}
      data-error={error ? '' : undefined}
      data-open={open || undefined}
    >
      {hidden && <span className="ed-badge">Hidden</span>}
      {isTemp(id) && <span className="ed-badge ed-badge--new">New</span>}
      {error && (
        <button
          type="button"
          className="ed-badge ed-badge--error"
          title={error.message}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openDetails();
          }}
        >
          Not saved
        </button>
      )}
      <button
        type="button"
        className="ed-tool ed-item-more"
        aria-expanded={open}
        aria-label={`Options for ${name}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <Icon name="more" />
      </button>
      <span className="ed-item-tools" role="toolbar" aria-label={`${config.singular}: ${name}`}>
        <span
          className="ed-tool ed-drag"
          draggable="true"
          title="Drag to reorder"
          aria-hidden="true"
          onDragStart={(event) => {
            event.stopPropagation();
            const host = markerRef.current.parentElement;
            activeDrag = { table, group, id };
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', at);
            event.dataTransfer.setDragImage?.(host, 24, 24);
            host.dataset.edDragging = '';
          }}
          onDragEnd={() => {
            activeDrag = null;
            if (markerRef.current) delete markerRef.current.parentElement.dataset.edDragging;
            document.querySelectorAll('[data-ed-drop]').forEach((el) => delete el.dataset.edDrop);
          }}
        >
          <Icon name="grip" />
        </span>
        <ToolButton icon="up" label="Move up" disabled={index <= 0} onClick={() => store.step(table, id, -1)} />
        <ToolButton icon="down" label="Move down" disabled={index >= siblings.length - 1} onClick={() => store.step(table, id, 1)} />
        <ToolButton
          icon={hidden ? 'eye' : 'eye-off'}
          label={hidden ? 'Show on the site' : 'Hide from the site'}
          onClick={() => store.toggleVisible(table, id)}
        />
        <ToolButton icon="edit" label="Edit details" onClick={openDetails} />
        {table === 'projects' && <ToolButton icon="open" label="Open project page" onClick={() => store.openProject(id)} />}
        {canAdd && (
          <ToolButton
            icon="plus"
            label={`Add ${config.singular} after this`}
            onClick={() => {
              const newId = store.add(table, { afterId: id });
              store.focusAt(`${table}.${newId}.${LABEL_FIELD[table]}`, { table, id: newId });
            }}
          />
        )}
        {canAdd && <ToolButton icon="copy" label="Duplicate" onClick={() => store.duplicate(table, id)} />}
        <ToolButton
          icon="trash"
          label="Delete"
          danger
          onClick={() => {
            const label = config.itemLabel?.(row) ? `"${config.itemLabel(row)}"` : `this ${config.singular}`;
            if (window.confirm(`Delete ${label}?${CHILDREN_NOTE[table] || ''} You can undo this until you save.`)) {
              store.remove(table, id);
            }
          }}
        />
      </span>
    </span>
  );
}
