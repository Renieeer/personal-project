import { useStore } from './store.js';
import { fileKey, findRow, parseAt, rowKey } from './model.js';
import { fileSpec } from './schema.js';
import Icon from './Icon.jsx';

// "Replace" control for an image or file. Images get it as an overlay on the
// picture; other files (the CV) as a small button. Removing a file is done in
// the item's details panel.
export default function EditorFile({ at }) {
  const store = useStore();
  const ref = parseAt(at);
  const spec = fileSpec(ref.table, ref.field);
  if (!spec || !findRow(store.state.draft, ref.table, ref.id)) return null;

  const change = store.state.files[fileKey(ref.table, ref.id, ref.field)];
  const error = store.state.errors[rowKey(ref.table, ref.id)]?.details?.[ref.field];
  const image = spec.kind === 'image';

  const choose = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const [file] = await store.pickFile({ accept: spec.accept });
    if (file) store.setFile(ref, spec, file);
  };

  return (
    <span className={`ed-file ed-ui${image ? ' ed-file--overlay' : ''}`}>
      <button type="button" className="ed-chip" onClick={choose} title={`${spec.label}: ${spec.hint}`}>
        <Icon name="image" />
        {image ? 'Replace image' : `Replace ${spec.label}`}
      </button>
      {change && <span className="ed-chip ed-chip--note">{change.remove ? 'Removed' : 'Not saved yet'}</span>}
      {error && <span className="ed-chip ed-chip--error" role="alert">{error}</span>}
    </span>
  );
}
