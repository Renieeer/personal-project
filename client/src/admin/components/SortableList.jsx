import { useState } from 'react';

// Drag-and-drop list (native HTML5 DnD via a handle) with Up/Down buttons
// as a keyboard- and touch-friendly alternative.
export default function SortableList({ items, getKey, onReorder, renderItem, disabled = false }) {
  const [armedIndex, setArmedIndex] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const reset = () => {
    setArmedIndex(null);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <ul className="admin-sortable">
      {items.map((item, index) => {
        const classes = ['admin-sortable-item'];
        if (dragIndex === index) classes.push('is-dragging');
        if (overIndex === index && dragIndex !== null && dragIndex !== index) {
          classes.push(dragIndex < index ? 'is-over-after' : 'is-over-before');
        }
        return (
          <li
            key={getKey(item)}
            className={classes.join(' ')}
            draggable={!disabled && armedIndex === index}
            onDragStart={(event) => {
              setDragIndex(index);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', String(index));
            }}
            onDragOver={(event) => {
              if (dragIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (overIndex !== index) setOverIndex(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              reset();
            }}
            onDragEnd={reset}
          >
            {!disabled && (
              <div className="admin-sort-controls">
                <span
                  className="admin-drag-handle"
                  title="Drag to reorder"
                  aria-hidden="true"
                  onMouseDown={() => setArmedIndex(index)}
                  onMouseUp={() => setArmedIndex(null)}
                />
                <button
                  type="button"
                  className="admin-sort-button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-sort-button"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  ↓
                </button>
              </div>
            )}
            <div className="admin-sortable-content">{renderItem(item, index)}</div>
          </li>
        );
      })}
    </ul>
  );
}
