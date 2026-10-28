import {
  useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EditContext } from '../../lib/edit.jsx';
import { StaticSiteData } from '../../lib/siteData.jsx';
import { readableTextOn } from '../../lib/format.js';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { ProjectView } from '../../pages/ProjectDetail.jsx';
import { EditorStore, initialState, reducer } from './store.js';
import { loadEditorData } from './load.js';
import { saveChanges } from './save.js';
import {
  countChanges, duplicateRow, fileKey, findRow, insertRow, isTemp, moveRow, newRow,
  parseAt, pruneFiles, removeRow, reserveTempIds, rowKey, setValue, stepRow, toSiteData,
} from './model.js';
import { PARENTS, SINGLETONS, checkFile } from './schema.js';
import EditorText from './EditorText.jsx';
import EditorFile from './EditorFile.jsx';
import EditorItem from './EditorItem.jsx';
import EditorAdd from './EditorAdd.jsx';
import EditorHome from './EditorHome.jsx';
import EditorBar from './EditorBar.jsx';
import SidePanel from './SidePanel.jsx';
import '../../styles/editor.css';

// What the public components render through lib/edit.jsx while editing.
const EDIT_COMPONENTS = { Text: EditorText, File: EditorFile, Item: EditorItem, Add: EditorAdd };

// Unsaved work survives leaving the editor (the back button, the admin
// menu) until the tab is closed or reloaded.
let unsavedState = null;

const hasChanges = (state) => countChanges(state.original, state.draft, state.files) > 0;

export default function LiveEditor() {
  const [state, dispatch] = useReducer(reducer, null, () => unsavedState || initialState);
  const [restored] = useState(() => Boolean(unsavedState));
  const stateRef = useRef(state);
  stateRef.current = state;

  const [params, setParams] = useSearchParams();
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const fileInput = useRef(null);

  const notify = useCallback((message, tone = 'info') => {
    clearTimeout(noticeTimer.current);
    setNotice({ message, tone });
    noticeTimer.current = setTimeout(() => setNotice(null), tone === 'error' ? 9000 : 4000);
  }, []);

  useEffect(() => {
    document.title = 'Live editor';
    if (restored) notify('Restored your unsaved changes.');
    return () => clearTimeout(noticeTimer.current);
  }, [restored, notify]);

  useEffect(() => {
    if (stateRef.current.status === 'ready') return undefined;
    let active = true;
    loadEditorData().then(
      ({ data, uiTextError }) => active && dispatch({ type: 'loaded', data, uiTextError }),
      (err) => active && dispatch({ type: 'failed', error: err.message }),
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    unsavedState = null;
    return () => {
      const current = stateRef.current;
      unsavedState = current.status === 'ready' && !current.saving && hasChanges(current)
        ? { ...current, coalesce: null }
        : null;
    };
  }, []);

  const data = useMemo(() => (state.draft ? toSiteData(state.draft, state.files) : null), [state.draft, state.files]);
  const changes = useMemo(() => countChanges(state.original, state.draft, state.files), [state.original, state.draft, state.files]);

  // --- Pages and panels ---------------------------------------------------

  const projectParam = params.get('project');
  const projectId = projectParam ? Number(projectParam) : null;
  const project = projectId !== null ? data?.projects.find((p) => p.id === projectId) : null;

  const openProject = useCallback((id) => {
    setParams(id === null ? {} : { project: String(id) });
    window.scrollTo(0, 0);
  }, [setParams]);

  // ?section=<key> scrolls to a section and ?panel=profile|settings|ui opens
  // a panel: the form pages link here with them.
  const linkHandled = useRef(false);
  useEffect(() => {
    if (state.status !== 'ready' || linkHandled.current) return;
    linkHandled.current = true;
    const section = params.get('section');
    const panelName = params.get('panel');
    if (['profile', 'settings', 'ui'].includes(panelName)) setPanel({ table: panelName, id: null });
    if (section) {
      requestAnimationFrame(() => document.getElementById(`ed-section-${section}`)?.scrollIntoView({ behavior: 'instant' }));
    }
    if (section || panelName) {
      setParams((prev) => {
        prev.delete('section');
        prev.delete('panel');
        return prev;
      }, { replace: true });
    }
  }, [state.status, params, setParams]);

  // Keep the bar height in a variable so the panel and scrolling can clear it.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const update = () => rootRef.current?.style.setProperty('--ed-bar-h', `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [state.status]);

  // --- Edits ----------------------------------------------------------------

  const pickFile = useCallback(({ accept, multiple = false }) => new Promise((resolve) => {
    const input = fileInput.current;
    input.accept = accept;
    input.multiple = multiple;
    input.value = '';
    input.onchange = () => resolve(Array.from(input.files || []));
    input.oncancel = () => resolve([]);
    input.click();
  }), []);

  // Focuses a field once it is on the page (after adding a row), or opens
  // the panel when it is not shown inline.
  const focusAt = useCallback((at, fallback) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector(`[data-ed-at="${at}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.focus();
      } else if (fallback) {
        setPanel(fallback);
      }
    }));
  }, []);

  const actions = useMemo(() => {
    const commit = (fn, options = {}) => dispatch({ type: 'commit', fn, ...options });
    const draftOnly = (change) => commit(({ draft, files }) => ({ draft: change(draft), files }));

    return {
      setValue: (ref, value, { coalesce } = {}) => commit(
        ({ draft, files }) => ({ draft: setValue(draft, ref, value), files }),
        { coalesce, touched: { key: rowKey(ref.table, ref.id), field: ref.field } },
      ),
      toggleVisible: (table, id) => draftOnly((draft) => {
        const row = findRow(draft, table, id);
        return row ? setValue(draft, { table, id, field: 'is_visible' }, row.is_visible === false) : draft;
      }),
      step: (table, id, dir) => draftOnly((draft) => stepRow(draft, table, id, dir)),
      move: (table, id, targetId, place) => draftOnly((draft) => moveRow(draft, table, id, targetId, place)),
      remove: (table, id) => commit(({ draft, files }) => {
        const next = removeRow(draft, table, id);
        return { draft: next, files: pruneFiles(next, files) };
      }),
      // Adds a row after `afterId` (same parent) or at the end of `parent`'s
      // rows, and returns its temporary id.
      add: (table, { parent, afterId } = {}) => {
        const extra = {};
        const foreignKey = PARENTS[table]?.[1];
        if (foreignKey) {
          const after = afterId != null ? findRow(stateRef.current.draft, table, afterId) : null;
          extra[foreignKey] = after ? after[foreignKey] : parent;
        }
        const row = newRow(table, extra);
        draftOnly((draft) => insertRow(draft, table, row, afterId ?? null));
        return row.id;
      },
      duplicate: (table, id) => {
        const ids = reserveTempIds(500);
        draftOnly((draft) => duplicateRow(draft, table, id, ids()));
      },
      addImages: (projectId, fileList) => {
        const valid = [];
        for (const file of fileList) {
          const problem = checkFile('image', file);
          if (problem) notify(problem, 'error');
          else valid.push(file);
        }
        if (!valid.length) return;
        const added = valid.map((file) => {
          const url = URL.createObjectURL(file);
          return { row: newRow('project_images', { project_id: projectId, caption: null, image_url: url }), file, url };
        });
        commit(({ draft, files }) => {
          let next = draft;
          const pending = { ...files };
          for (const { row, file, url } of added) {
            next = insertRow(next, 'project_images', row);
            pending[fileKey('project_images', row.id, 'image')] = { file, url };
          }
          return { draft: next, files: pending };
        });
      },
      setFile: (ref, spec, file) => {
        const problem = checkFile(spec.kind, file);
        if (problem) {
          notify(problem, 'error');
          return;
        }
        const url = URL.createObjectURL(file);
        commit(
          ({ draft, files }) => ({ draft, files: { ...files, [fileKey(ref.table, ref.id, ref.field)]: { file, url } } }),
          { touched: { key: rowKey(ref.table, ref.id), field: ref.field } },
        );
      },
      // Drops a chosen file; for a saved file, marks it for removal.
      removeFile: (ref) => commit(({ draft, files }) => {
        const key = fileKey(ref.table, ref.id, ref.field);
        const row = findRow(draft, ref.table, ref.id);
        const { [key]: dropped, ...rest } = files;
        const saved = row?.[`${ref.field}_url`] && (SINGLETONS.includes(ref.table) || !isTemp(ref.id));
        return { draft, files: saved ? { ...rest, [key]: { remove: true } } : rest };
      }),
    };
  }, [notify]);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  // --- Saving ---------------------------------------------------------------

  const save = useCallback(async () => {
    // Let a field that is still being edited commit first.
    if (rootRef.current?.contains(document.activeElement)) document.activeElement.blur();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const current = stateRef.current;
    if (current.status !== 'ready' || current.saving || !hasChanges(current)) return;

    dispatch({ type: 'saveStart' });
    let result;
    try {
      result = await saveChanges(current);
    } catch (err) {
      dispatch({ type: 'saveFailed' });
      notify(err.message, 'error');
      return;
    }
    dispatch({ type: 'saveDone', ...result });

    // Pages and panels that showed a new row now use its real id.
    const realId = (table, id) => result.idMap[rowKey(table, id)] ?? id;
    const shownProject = Number(new URLSearchParams(window.location.search).get('project'));
    if (isTemp(shownProject)) setParams({ project: String(realId('projects', shownProject)) }, { replace: true });
    setPanel((open) => (open && isTemp(open.id) ? { ...open, id: realId(open.table, open.id) } : open));

    const failed = Object.keys(result.errors).length;
    if (failed) notify(`Some changes could not be saved (${failed} ${failed === 1 ? 'item' : 'items'}). They are marked on the page.`, 'error');
    else notify('All changes saved.');
  }, [notify, setParams]);

  const discard = useCallback(() => {
    if (window.confirm('Discard all unsaved changes? You can still undo this.')) dispatch({ type: 'discard' });
  }, []);

  // Opens the first item that could not be saved.
  const showErrors = () => {
    const [key, error] = Object.entries(state.errors)[0] || [];
    if (!key) return;
    const [table, rawId] = key.split(':');
    if (table === 'ui') {
      setPanel({ table: 'ui', id: null });
    } else if (rawId !== '' || SINGLETONS.includes(table)) {
      const { id } = parseAt(`${table}.${rawId || 'x'}`);
      const target = { table, id: SINGLETONS.includes(table) ? null : id };
      if (table === 'project_images') {
        const image = findRow(state.draft, table, id);
        if (image) openProject(image.project_id);
      }
      setPanel(target);
    }
    notify(error.message, 'error');
  };

  // --- Keyboard and leaving -------------------------------------------------

  useEffect(() => {
    const onKey = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        save();
        return;
      }
      // Inside a field, undo/redo belong to the field.
      const el = event.target;
      if (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, undo, redo]);

  useEffect(() => {
    if (!changes) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [changes]);

  const leave = (event) => {
    if (changes && !window.confirm('You have unsaved changes. Leave the editor? They are kept until you reload or close this tab.')) {
      event.preventDefault();
    }
  };

  const store = useMemo(() => ({
    state, data, ...actions, openPanel: setPanel, openProject, notify, pickFile, focusAt,
  }), [state, data, actions, openProject, notify, pickFile, focusAt]);

  // --- Render ---------------------------------------------------------------

  if (state.status === 'loading') return <div className="admin-boot">Loading the editor…</div>;
  if (state.status === 'error') {
    return (
      <div className="admin-login">
        <div className="admin-login-form">
          <h1 className="admin-title">Live editor</h1>
          <p className="admin-alert" role="alert">{state.error}</p>
          <Link className="admin-small" to="/admin">Back to admin</Link>
        </div>
      </div>
    );
  }

  const accent = data.settings?.accent_color;
  const previewStyle = /^#[0-9a-f]{6}$/i.test(accent || '')
    ? { '--accent': accent, '--on-accent': readableTextOn(accent) }
    : undefined;

  return (
    <EditorStore.Provider value={store}>
      <div className="ed" ref={rootRef}>
        <EditorBar
          barRef={barRef}
          projects={data.projects}
          projectId={project ? project.id : null}
          onPage={openProject}
          openPanel={setPanel}
          changes={changes}
          errorCount={Object.keys(state.errors).length}
          saving={state.saving}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onSave={save}
          onDiscard={discard}
          onLeave={leave}
          onShowErrors={showErrors}
        />
        {state.uiTextError && (
          <p className="ed-banner" role="status">
            Button and label texts can't be edited yet: {state.uiTextError}
          </p>
        )}

        <EditContext.Provider value={EDIT_COMPONENTS}>
          <StaticSiteData data={data}>
            {/* Links don't navigate and the contact form doesn't send while editing. */}
            <div
              className="site ed-preview"
              style={previewStyle}
              inert={state.saving ? '' : undefined}
              onClickCapture={(event) => {
                if (event.target.closest('a, label, .ed-text')) event.preventDefault();
              }}
              onSubmitCapture={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <Header />
              <main id="main">
                {project
                  ? (
                    <ProjectView
                      key={project.id}
                      project={project}
                      images={data.gallery.filter((image) => image.project_id === project.id)}
                    />
                  )
                  : <EditorHome />}
              </main>
              <Footer />
            </div>
          </StaticSiteData>
        </EditContext.Provider>

        {panel && <SidePanel key={`${panel.table}:${panel.id}`} target={panel} onClose={() => setPanel(null)} />}
        {notice && (
          <p className={`ed-toast${notice.tone === 'error' ? ' is-error' : ''}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
            {notice.message}
          </p>
        )}
        <input ref={fileInput} type="file" hidden />
      </div>
    </EditorStore.Provider>
  );
}
