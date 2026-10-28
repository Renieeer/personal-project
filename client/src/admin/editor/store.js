import { createContext, useContext } from 'react';

// Live editor state. Everything the page shows comes from `draft`; `original`
// is what the server holds. `past`/`future` are undo/redo snapshots of
// { draft, files }.
export const initialState = {
  status: 'loading',
  error: null,
  uiTextError: null,
  original: null,
  draft: null,
  files: {},
  errors: {},
  past: [],
  future: [],
  coalesce: null,
  saving: false,
};

const HISTORY_LIMIT = 100;

// Editing a field clears the save error shown next to it.
function clearError(errors, key, field) {
  const entry = errors[key];
  if (!entry) return errors;
  const { [key]: removed, ...rest } = errors;
  if (!entry.details) return rest;
  const { [field]: cleared, ...details } = entry.details;
  if (cleared === undefined) return errors;
  return Object.keys(details).length ? { ...rest, [key]: { ...entry, details } } : rest;
}

export function reducer(state, action) {
  const current = { draft: state.draft, files: state.files };
  switch (action.type) {
    case 'loaded':
      return { ...initialState, status: 'ready', original: action.data, draft: action.data, uiTextError: action.uiTextError };
    case 'failed':
      return { ...initialState, status: 'error', error: action.error };
    // action.fn({ draft, files }) => { draft, files } must be pure. Commits
    // with the same `coalesce` key in a row (typing in one field) share one undo step.
    case 'commit': {
      if (state.saving || !state.draft) return state;
      const next = action.fn(current);
      if (!next || (next.draft === current.draft && next.files === current.files)) return state;
      const merge = Boolean(action.coalesce) && action.coalesce === state.coalesce;
      return {
        ...state,
        draft: next.draft,
        files: next.files,
        errors: action.touched ? clearError(state.errors, action.touched.key, action.touched.field) : state.errors,
        past: merge ? state.past : [...state.past, current].slice(-HISTORY_LIMIT),
        future: [],
        coalesce: action.coalesce || null,
      };
    }
    case 'undo': {
      if (state.saving || !state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state, ...previous, past: state.past.slice(0, -1), future: [current, ...state.future], coalesce: null,
      };
    }
    case 'redo': {
      if (state.saving || !state.future.length) return state;
      const [following, ...rest] = state.future;
      return {
        ...state, ...following, past: [...state.past, current], future: rest, coalesce: null,
      };
    }
    case 'discard':
      return {
        ...state,
        draft: state.original,
        files: {},
        errors: {},
        past: [...state.past, current].slice(-HISTORY_LIMIT),
        future: [],
        coalesce: null,
      };
    case 'saveStart':
      return { ...state, saving: true, coalesce: null };
    case 'saveDone':
      // Temporary ids are gone after a save, so older snapshots no longer apply.
      return {
        ...state,
        saving: false,
        original: action.original,
        draft: action.draft,
        files: action.files,
        errors: action.errors,
        past: [],
        future: [],
      };
    case 'saveFailed':
      return { ...state, saving: false };
    default:
      return state;
  }
}

export const EditorStore = createContext(null);
export const useStore = () => useContext(EditorStore);
