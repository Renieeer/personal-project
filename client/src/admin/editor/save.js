import { api } from '../../lib/api.js';
import { LISTS, PARENTS, SINGLETONS, fieldNames, fileFields, groupOf } from './schema.js';
import {
  changedFields, changedTexts, fileKey, groupRows, isTemp, pruneFiles, rowKey,
} from './model.js';

// Puts `ids` (in that order) into the slots the group's rows hold in `rows`.
function reorderGroup(rows, table, group, ids) {
  const slots = [];
  rows.forEach((row, i) => groupOf(table, row) === group && slots.push(i));
  const members = rows.filter((row) => groupOf(table, row) === group);
  const ordered = [
    ...ids.map((id) => members.find((row) => row.id === id)).filter(Boolean),
    ...members.filter((row) => !ids.includes(row.id)),
  ];
  const out = rows.slice();
  slots.forEach((slot, i) => {
    out[slot] = ordered[i];
  });
  return out;
}

/**
 * Sends every difference between `original` and `draft` (plus pending files)
 * to the admin API, one request at a time. A failed request does not stop
 * the others. Returns the new saved state:
 *   original  what the server now holds
 *   draft     the draft with real ids; failed changes are still in it
 *   files     pending files that did not upload
 *   errors    { rowKey: { message, details } } for failed requests
 *   idMap     { rowKey of a new row: its real id }
 */
export async function saveChanges({ original, draft, files }) {
  let base = original;
  let next = draft;
  let pending = { ...files };
  const errors = {};
  const idMap = {};

  const run = async (table, id, fn, field) => {
    try {
      return await fn();
    } catch (err) {
      const key = rowKey(table, id);
      const details = field ? { [field]: err.message } : err.details || null;
      const previous = errors[key];
      errors[key] = previous
        ? { message: previous.message, details: { ...previous.details, ...details } }
        : { message: err.message, details };
      return null;
    }
  };

  // Stores a row the server returned in both the saved state and the draft.
  const accept = (table, row) => {
    if (SINGLETONS.includes(table)) {
      base = { ...base, [table]: row };
      next = { ...next, [table]: row };
      return;
    }
    const key = table === 'sections' ? 'key' : 'id';
    const swap = (rows) => rows.map((r) => (r[key] === row[key] ? row : r));
    base = { ...base, [table]: swap(base[table]) };
    next = { ...next, [table]: swap(next[table]) };
  };

  const dropPending = (key) => {
    const { [key]: removed, ...rest } = pending;
    if (removed?.url) URL.revokeObjectURL(removed.url);
    pending = rest;
  };

  const saveFiles = async (table, id, path) => {
    for (const field of fileFields(table)) {
      const key = fileKey(table, id, field);
      const change = pending[key];
      if (!change) continue;
      const row = await run(table, id, () => (change.remove
        ? api.del(`${path}/files/${field}`)
        : api.upload(`${path}/files/${field}`, { file: change.file })), field);
      if (row) {
        accept(table, row);
        dropPending(key);
      }
    }
  };

  // Gives a newly created row its real id everywhere the draft refers to it.
  const remap = (table, tempId, savedRow, draftRow = savedRow) => {
    idMap[rowKey(table, tempId)] = savedRow.id;
    base = { ...base, [table]: [...base[table], savedRow] };
    next = { ...next, [table]: next[table].map((row) => (row.id === tempId ? draftRow : row)) };
    for (const [child, [parent, foreignKey]] of Object.entries(PARENTS)) {
      if (parent !== table) continue;
      next = {
        ...next,
        [child]: next[child].map((row) => (row[foreignKey] === tempId ? { ...row, [foreignKey]: savedRow.id } : row)),
      };
    }
    const prefix = `${rowKey(table, tempId)}:`;
    pending = Object.fromEntries(Object.entries(pending).map(([key, value]) => [
      key.startsWith(prefix) ? `${rowKey(table, savedRow.id)}:${key.slice(prefix.length)}` : key,
      value,
    ]));
  };

  // Profile and settings
  for (const table of SINGLETONS) {
    const patch = changedFields(table, base[table], next[table]);
    if (Object.keys(patch).length) {
      const row = await run(table, null, () => api.put(`/admin/${table}`, patch));
      if (row) accept(table, row);
    }
    await saveFiles(table, null, `/admin/${table}`);
  }

  // Interface text
  const textPatch = changedTexts(base.ui_text, next.ui_text);
  if (Object.keys(textPatch).length) {
    const row = await run('ui', null, () => api.put('/admin/ui_text', { texts: textPatch }));
    if (row) {
      base = { ...base, ui_text: row };
      next = { ...next, ui_text: row };
    }
  }

  // Sections
  for (const section of next.sections) {
    const before = base.sections.find((s) => s.key === section.key);
    const patch = before ? changedFields('sections', before, section) : {};
    if (!Object.keys(patch).length) continue;
    const row = await run('sections', section.key, () => api.put(`/admin/sections/${section.key}`, patch));
    if (row) accept('sections', row);
  }
  const keys = next.sections.map((s) => s.key);
  if (keys.join() !== base.sections.map((s) => s.key).join()) {
    const ok = await run('sections', null, () => api.put('/admin/sections/reorder', { keys }));
    if (ok) base = { ...base, sections: keys.map((key) => base.sections.find((s) => s.key === key)) };
  }

  // Lists, parents before children
  for (const table of LISTS) {
    const parent = PARENTS[table];
    const movedGroups = new Set();

    // 1. Deleted rows
    const kept = new Set(next[table].map((row) => row.id));
    for (const row of base[table].filter((r) => !kept.has(r.id))) {
      if (parent && !base[parent[0]].some((p) => p.id === row[parent[1]])) {
        // Its parent was deleted above, which deleted it too.
        base = { ...base, [table]: base[table].filter((r) => r.id !== row.id) };
        continue;
      }
      // Deleted along with a parent whose delete failed: retry on the next save.
      if (parent && !next[parent[0]].some((p) => p.id === row[parent[1]])) continue;
      const ok = await run(table, row.id, () => api.del(`/admin/${table}/${row.id}`));
      if (ok) base = { ...base, [table]: base[table].filter((r) => r.id !== row.id) };
    }

    // 2. New rows
    for (const row of next[table].filter((r) => isTemp(r.id))) {
      if (parent && isTemp(row[parent[1]])) {
        errors[rowKey(table, row.id)] = {
          message: `Not saved because its ${parent[0] === 'projects' ? 'project' : 'category'} could not be saved.`,
          details: null,
        };
        continue;
      }
      if (table === 'project_images') {
        // Gallery images are created by uploading them. Caption and visibility
        // are sent by the update step below.
        const key = fileKey(table, row.id, 'image');
        const file = pending[key]?.file;
        if (!file) continue;
        const rows = await run(table, row.id, () => api.upload('/admin/project_images/upload', {
          project_id: row.project_id,
          files: [file],
        }));
        if (!rows?.[0]) continue;
        remap(table, row.id, rows[0], { ...rows[0], caption: row.caption, is_visible: row.is_visible });
        dropPending(fileKey(table, rows[0].id, 'image'));
        continue;
      }
      const payload = Object.fromEntries(fieldNames(table).map((field) => [field, row[field] ?? null]));
      const created = await run(table, row.id, () => api.post(`/admin/${table}`, payload));
      if (created) remap(table, row.id, created);
    }

    // 3. Changed rows
    for (const row of next[table].filter((r) => !isTemp(r.id))) {
      const before = base[table].find((r) => r.id === row.id);
      if (!before) continue;
      const patch = changedFields(table, before, row);
      if (!Object.keys(patch).length) continue;
      if (parent && parent[1] in patch) {
        movedGroups.add(groupOf(table, before));
        movedGroups.add(groupOf(table, row));
      }
      const saved = await run(table, row.id, () => api.put(`/admin/${table}/${row.id}`, patch));
      if (saved) accept(table, saved);
    }

    // 4. Files
    for (const row of next[table].filter((r) => !isTemp(r.id))) {
      await saveFiles(table, row.id, `/admin/${table}/${row.id}`);
    }

    // 5. Order, per parent for skills and gallery images
    for (const group of new Set(next[table].map((row) => groupOf(table, row)))) {
      const wanted = groupRows(next[table], table, group).map((row) => row.id).filter((id) => !isTemp(id));
      const current = groupRows(base[table], table, group).map((row) => row.id);
      if (!wanted.length || (!movedGroups.has(group) && wanted.join() === current.join())) continue;
      const ok = await run(table, null, () => api.put(`/admin/${table}/reorder`, { ids: wanted }));
      if (ok) base = { ...base, [table]: reorderGroup(base[table], table, group, wanted) };
    }
  }

  return { original: base, draft: next, files: pruneFiles(next, pending), errors, idMap };
}
