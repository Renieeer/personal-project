import { createContext, useContext } from 'react';

// Hooks for the live editor in the admin panel. The public site has no
// provider, so each helper renders its children unchanged (or nothing). The
// editor supplies the real components through EditContext, which keeps the
// editing code out of the public bundle.
export const EditContext = createContext(null);
export const useEditor = () => useContext(EditContext);

// Inline-editable text. `at` names the value: "table.field" for single-row
// tables (profile, settings, ui) and "table.id.field" for rows, for example
// "projects.12.title" or "sections.about.title". With `block` it edits
// multi-paragraph text; with `panel` a click opens the item's full form.
export function EditText(props) {
  const editor = useEditor();
  return editor ? <editor.Text {...props} /> : (props.children ?? null);
}

// Replace control for an image or file ("profile.photo", "projects.12.thumbnail"),
// placed inside the element that shows it.
export function EditFile(props) {
  const editor = useEditor();
  return editor ? <editor.File {...props} /> : null;
}

// Toolbar for a list row ("projects.12"): move, hide, duplicate, delete.
// Placed inside the element that shows the row.
export function EditItem(props) {
  const editor = useEditor();
  return editor ? <editor.Item {...props} /> : null;
}

// "Add" button placed after a list. `parent` is the category or project id
// for skills and gallery images.
export function EditAdd(props) {
  const editor = useEditor();
  return editor ? <editor.Add {...props} /> : null;
}
