import { api } from '../../lib/api.js';
import { LISTS, SINGLETONS } from './schema.js';

// Loads everything the live editor shows, hidden rows included. A missing
// ui_text table is not fatal: the page still loads, with the default texts,
// and uiTextError says why they cannot be edited yet.
export async function loadEditorData() {
  const tables = [...SINGLETONS, 'sections', ...LISTS];
  const [rows, uiText] = await Promise.all([
    Promise.all(tables.map((table) => api.get(`/admin/${table}`))),
    api.get('/admin/ui_text').then(
      (row) => ({ row, error: null }),
      (err) => ({ row: { texts: {} }, error: err.message }),
    ),
  ]);
  const data = Object.fromEntries(tables.map((table, i) => [table, rows[i]]));
  data.ui_text = { ...uiText.row, texts: uiText.row.texts || {} };
  return { data, uiTextError: uiText.error };
}
