import { UI_TEXT_DEFAULTS } from '../../lib/uiText.js';
import {
  LABEL_FIELD, LISTS, NEW_ROW, PARENTS, SINGLETONS, fieldNames, fileFields, groupOf,
} from './schema.js';

// The draft holds every table as the admin API returns it:
//   { profile, settings, ui_text: { texts }, sections: [...], <list table>: [...] }
// Array order is display order. New rows get negative temporary ids until saved.
// Pending files live next to it, keyed by fileKey(): { file, url } or { remove: true }.

let lastTempId = 0;
export const newTempId = () => {
  lastTempId -= 1;
  return lastTempId;
};

// Reserves `count` ids and returns a function handing them out in order. The
// draft changes run inside the reducer, which must be pure, so ids are
// reserved before dispatching.
export function reserveTempIds(count) {
  const first = lastTempId - 1;
  lastTempId -= count;
  return () => {
    let i = 0;
    return () => first - i++;
  };
}

export const isTemp = (id) => typeof id === 'number' && id < 0;

export const rowKey = (table, id) => `${table}:${id ?? ''}`;
export const fileKey = (table, id, field) => `${rowKey(table, id)}:${field}`;

const isSingle = (table) => table === 'ui' || SINGLETONS.includes(table);
const idOf = (table, row) => (table === 'sections' ? row.key : row.id);

// "profile.title" | "ui.hero_cv" | "projects.12.title" | "projects.12" | "sections.about.title"
export function parseAt(at) {
  const [table, a, b] = at.split('.');
  if (isSingle(table)) return { table, id: null, field: a };
  return { table, id: table === 'sections' ? a : Number(a), field: b };
}

export function findRow(draft, table, id) {
  if (table === 'ui') return draft.ui_text;
  if (SINGLETONS.includes(table)) return draft[table];
  return draft[table]?.find((row) => idOf(table, row) === id) || null;
}

export function getValue(draft, { table, id, field }) {
  if (table === 'ui') return draft.ui_text.texts?.[field] || UI_TEXT_DEFAULTS[field] || '';
  return findRow(draft, table, id)?.[field] ?? null;
}

export function setValue(draft, { table, id, field }, value) {
  if (table === 'ui') {
    // Text equal to the default (or empty) is stored as "no override".
    const texts = { ...draft.ui_text.texts };
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text || text === UI_TEXT_DEFAULTS[field]) delete texts[field];
    else texts[field] = text;
    return { ...draft, ui_text: { ...draft.ui_text, texts } };
  }
  if (SINGLETONS.includes(table)) return { ...draft, [table]: { ...draft[table], [field]: value } };
  return {
    ...draft,
    [table]: draft[table].map((row) => (idOf(table, row) === id ? { ...row, [field]: value } : row)),
  };
}

export const groupRows = (rows, table, group) => rows.filter((row) => groupOf(table, row) === group);

export function newRow(table, extra = {}, id = newTempId()) {
  const row = { ...NEW_ROW[table]?.(), is_visible: true, ...extra, id };
  for (const field of fileFields(table)) {
    row[`${field}_url`] ??= null;
    row[`${field}_path`] ??= null;
  }
  return row;
}

// Inserts after `afterId`, or at the end of the row's group.
export function insertRow(draft, table, row, afterId = null) {
  const rows = draft[table].slice();
  let index = rows.length;
  if (afterId != null) {
    const at = rows.findIndex((r) => r.id === afterId);
    if (at >= 0) index = at + 1;
  } else if (PARENTS[table]) {
    const last = rows.map((r) => groupOf(table, r)).lastIndexOf(groupOf(table, row));
    if (last >= 0) index = last + 1;
  }
  rows.splice(index, 0, row);
  return { ...draft, [table]: rows };
}

// Removes a row and, like the database, the rows that belong to it.
export function removeRow(draft, table, id) {
  let next = { ...draft, [table]: draft[table].filter((row) => row.id !== id) };
  for (const [child, [parent, key]] of Object.entries(PARENTS)) {
    if (parent === table) next = { ...next, [child]: next[child].filter((row) => row[key] !== id) };
  }
  return next;
}

export function moveRow(draft, table, id, targetId, place) {
  const rows = draft[table].slice();
  const from = rows.findIndex((row) => idOf(table, row) === id);
  if (from < 0) return draft;
  const [row] = rows.splice(from, 1);
  let to = rows.findIndex((r) => idOf(table, r) === targetId);
  if (to < 0) return draft;
  if (place === 'after') to += 1;
  rows.splice(to, 0, row);
  return { ...draft, [table]: rows };
}

// Moves a row one place up (-1) or down (+1) within its group.
export function stepRow(draft, table, id, dir) {
  const row = findRow(draft, table, id);
  if (!row) return draft;
  const siblings = groupRows(draft[table], table, groupOf(table, row));
  const neighbor = siblings[siblings.indexOf(row) + dir];
  return neighbor ? moveRow(draft, table, id, idOf(table, neighbor), dir < 0 ? 'before' : 'after') : draft;
}

// Copies a row (without its files) right after the original; a category is
// copied with its skills. `nextId` hands out the new ids (see reserveTempIds),
// and the first one is the copy's.
export function duplicateRow(draft, table, id, nextId) {
  const row = findRow(draft, table, id);
  if (!row) return draft;
  const copy = { ...row, id: nextId() };
  for (const field of fileFields(table)) {
    copy[`${field}_url`] = null;
    copy[`${field}_path`] = null;
  }
  const label = LABEL_FIELD[table];
  if (label && row[label]) copy[label] = `${row[label]} (copy)`;
  if (table === 'projects') copy.slug = '';

  let next = insertRow(draft, table, copy, id);
  if (table === 'skill_categories') {
    for (const skill of groupRows(draft.skills, 'skills', id)) {
      next = insertRow(next, 'skills', { ...skill, id: nextId(), category_id: copy.id });
    }
  }
  return next;
}

// Drops pending files whose row no longer exists.
export function pruneFiles(draft, files) {
  const kept = Object.entries(files).filter(([key]) => {
    const [table, id] = key.split(':');
    return isSingle(table) || draft[table]?.some((row) => String(row.id) === id);
  });
  return kept.length === Object.keys(files).length ? files : Object.fromEntries(kept);
}

// The data shape the public components expect (see lib/siteData.jsx), built
// from the draft. Hidden rows stay in; pending files show as previews.
export function toSiteData(draft, files) {
  const withFiles = (table, row) => {
    if (!row) return row;
    let out = row;
    for (const field of fileFields(table)) {
      const change = files[fileKey(table, SINGLETONS.includes(table) ? null : row.id, field)];
      if (change) out = { ...out, [`${field}_url`]: change.remove ? null : change.url };
    }
    return out;
  };
  const list = (table) => draft[table].map((row) => withFiles(table, row));
  const skills = list('skills');

  return {
    profile: withFiles('profile', draft.profile),
    settings: withFiles('settings', draft.settings),
    ui: draft.ui_text.texts || {},
    sections: draft.sections,
    socials: list('social_links'),
    skills: list('skill_categories').map((category) => ({
      ...category,
      skills: skills.filter((skill) => skill.category_id === category.id),
    })),
    experience: list('experience'),
    education: list('education'),
    projects: list('projects'),
    gallery: list('project_images'),
    certificates: list('certificates'),
    testimonials: list('testimonials'),
  };
}

// --- Changes -----------------------------------------------------------

const norm = (value) => (value === '' || value === undefined ? null : value);
const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

// The API fields of `after` that differ from `before`.
export function changedFields(table, before, after) {
  const patch = {};
  for (const field of fieldNames(table)) {
    if (!same(before?.[field], after?.[field])) patch[field] = norm(after?.[field]);
  }
  return patch;
}

export function changedTexts(before, after) {
  const a = before?.texts || {};
  const b = after?.texts || {};
  const patch = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[key] || null) !== (b[key] || null)) patch[key] = b[key] || null;
  }
  return patch;
}

// True when the rows both lists share are in a different order.
export function orderChanged(before, after) {
  const common = new Set(before.filter((id) => after.includes(id)));
  const a = before.filter((id) => common.has(id));
  const b = after.filter((id) => common.has(id));
  return a.some((id, i) => id !== b[i]);
}

function parentGone(draft, table, row) {
  const parent = PARENTS[table];
  return Boolean(parent && !draft[parent[0]].some((p) => p.id === row[parent[1]]));
}

// Number of unsaved changes: each changed field, added or deleted row,
// reordered list and file counts as one.
export function countChanges(original, draft, files) {
  if (!original || !draft) return 0;
  let count = 0;
  for (const table of SINGLETONS) count += Object.keys(changedFields(table, original[table], draft[table])).length;
  count += Object.keys(changedTexts(original.ui_text, draft.ui_text)).length;

  for (const section of draft.sections) {
    const before = original.sections.find((s) => s.key === section.key);
    if (before) count += Object.keys(changedFields('sections', before, section)).length;
  }
  if (orderChanged(original.sections.map((s) => s.key), draft.sections.map((s) => s.key))) count += 1;

  for (const table of LISTS) {
    const before = new Map(original[table].map((row) => [row.id, row]));
    const after = new Set(draft[table].map((row) => row.id));
    for (const row of draft[table]) {
      const prev = before.get(row.id);
      count += prev ? Object.keys(changedFields(table, prev, row)).length : 1;
    }
    for (const row of original[table]) {
      if (!after.has(row.id) && !parentGone(draft, table, row)) count += 1;
    }
    for (const group of new Set(original[table].map((row) => groupOf(table, row)))) {
      const ids = (rows) => groupRows(rows, table, group).map((row) => row.id);
      if (orderChanged(ids(original[table]), ids(draft[table]))) count += 1;
    }
  }

  // Files of new rows are part of adding the row.
  count += Object.keys(files).filter((key) => !isTemp(Number(key.split(':')[1]))).length;
  return count;
}
