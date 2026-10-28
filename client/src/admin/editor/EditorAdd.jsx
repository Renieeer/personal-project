import { useStore } from './store.js';
import { IMAGE } from '../resources.js';
import { LABEL_FIELD, configFor } from './schema.js';
import Icon from './Icon.jsx';

// "Add" button after a list. New rows go to the end of the list (or of the
// category for skills), and their main text is focused for typing.
export default function EditorAdd({ table, parent }) {
  const store = useStore();
  const config = configFor(table);

  const add = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (table === 'project_images') {
      store.addImages(parent, await store.pickFile({ accept: IMAGE.accept, multiple: true }));
      return;
    }
    const id = store.add(table, { parent });
    store.focusAt(`${table}.${id}.${LABEL_FIELD[table]}`, { table, id });
  };

  return (
    <div className="ed-add ed-ui">
      <button type="button" className="ed-add-button" onClick={add}>
        <Icon name="plus" />
        {table === 'project_images' ? 'Add gallery images' : `Add ${config.singular}`}
      </button>
    </div>
  );
}
