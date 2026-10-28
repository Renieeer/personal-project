import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler, must, parseId } from '../lib/http.js';
import { t, validate } from '../lib/validate.js';
import { uploadToBucket, removeFromBucket } from '../lib/storage.js';
import { handleUpload } from '../middleware/upload.js';

export async function nextSortOrder(table, match = {}) {
  const rows = must(await supabaseAdmin.from(table).select('sort_order').match(match)
    .order('sort_order', { ascending: false }).limit(1));
  return rows.length ? rows[0].sort_order + 1 : 0;
}

// Removes every stored file referenced by a row (columns named <field>_path).
async function removeRowFiles(files, row) {
  await Promise.all(Object.entries(files).map(([field, cfg]) => removeFromBucket(cfg.bucket, [row[`${field}_path`]])));
}

async function replaceFile({ table, match, field, cfg, file }) {
  const current = must(await supabaseAdmin.from(table).select('*').match(match).maybeSingle());
  if (!current) throw new HttpError(404, 'Record not found.');

  const uploaded = await uploadToBucket(cfg.bucket, file, table);
  const { data, error } = await supabaseAdmin.from(table)
    .update({ [`${field}_url`]: uploaded.url, [`${field}_path`]: uploaded.path })
    .match(match).select().single();
  if (error) {
    await removeFromBucket(cfg.bucket, [uploaded.path]);
    must({ error });
  }
  await removeFromBucket(cfg.bucket, [current[`${field}_path`]]);
  return data;
}

async function clearFile({ table, match, field, cfg }) {
  const current = must(await supabaseAdmin.from(table).select('*').match(match).maybeSingle());
  if (!current) throw new HttpError(404, 'Record not found.');

  const data = must(await supabaseAdmin.from(table)
    .update({ [`${field}_url`]: null, [`${field}_path`]: null })
    .match(match).select().single());
  await removeFromBucket(cfg.bucket, [current[`${field}_path`]]);
  return data;
}

// POST <prefix>/files/:field uploads/replaces a file; DELETE removes it.
function mountFileRoutes(router, prefix, { table, files, matchFor }) {
  const resolveField = (req, res, next) => {
    const cfg = files[req.params.field];
    if (!cfg) return next(new HttpError(404, 'Unknown file field.'));
    req.fileCfg = cfg;
    next();
  };

  router.post(
    `${prefix}/files/:field`,
    resolveField,
    (req, res, next) => handleUpload(req.fileCfg.kind)(req, res, next),
    asyncHandler(async (req, res) => {
      res.json(await replaceFile({ table, match: matchFor(req), field: req.params.field, cfg: req.fileCfg, file: req.files[0] }));
    }),
  );

  router.delete(`${prefix}/files/:field`, resolveField, asyncHandler(async (req, res) => {
    res.json(await clearFile({ table, match: matchFor(req), field: req.params.field, cfg: req.fileCfg }));
  }));
}

/**
 * Full CRUD for a list table with sort_order and is_visible.
 *   GET    /             list (all rows, hidden included), optional ?<filter>=value
 *   POST   /             create
 *   PUT    /reorder      { ids: [...] } sets sort_order by position
 *   PUT    /:id          partial update (also used to toggle is_visible)
 *   DELETE /:id          delete row and its stored files
 *   POST   /:id/files/:field, DELETE /:id/files/:field
 */
export function crudRouter({ table, fields, files = {}, filters = [], prepare, collectFiles, extend }) {
  const router = express.Router();
  const schema = { ...fields, is_visible: t.bool() };

  extend?.(router);

  router.get('/', asyncHandler(async (req, res) => {
    let query = supabaseAdmin.from(table).select('*');
    for (const filter of filters) {
      if (req.query[filter] !== undefined) query = query.eq(filter, String(req.query[filter]));
    }
    res.json(must(await query.order('sort_order', { ascending: true }).order('id', { ascending: true })));
  }));

  router.post('/', asyncHandler(async (req, res) => {
    let data = validate(schema, req.body);
    if (prepare) data = await prepare(data, { isNew: true });
    data.sort_order = await nextSortOrder(table);
    res.status(201).json(must(await supabaseAdmin.from(table).insert(data).select().single()));
  }));

  router.put('/reorder', asyncHandler(async (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.length || !ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
      throw new HttpError(400, 'ids must be a non-empty array of record ids.');
    }
    await Promise.all(ids.map((id, index) =>
      supabaseAdmin.from(table).update({ sort_order: index }).eq('id', id).then(must)));
    res.json({ ok: true });
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    let data = validate(schema, req.body, { partial: true });
    if (prepare) data = await prepare(data, { isNew: false, id });
    if (!Object.keys(data).length) throw new HttpError(400, 'Nothing to update.');
    const row = must(await supabaseAdmin.from(table).update(data).eq('id', id).select().maybeSingle());
    if (!row) throw new HttpError(404, 'Record not found.');
    res.json(row);
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const row = must(await supabaseAdmin.from(table).select('*').eq('id', id).maybeSingle());
    if (!row) throw new HttpError(404, 'Record not found.');

    // Files of child rows removed by ON DELETE CASCADE (e.g. project gallery).
    const extra = collectFiles ? await collectFiles(row) : [];

    must(await supabaseAdmin.from(table).delete().eq('id', id));
    await removeRowFiles(files, row);
    await Promise.all(extra.map(({ bucket, paths }) => removeFromBucket(bucket, paths)));
    res.json({ ok: true });
  }));

  mountFileRoutes(router, '/:id', { table, files, matchFor: (req) => ({ id: parseId(req.params.id) }) });

  return router;
}

/**
 * Read/update for a single-row table (id = 1).
 *   GET /, PUT /, POST /files/:field, DELETE /files/:field
 */
export function singletonRouter({ table, fields, files = {} }) {
  const router = express.Router();
  const ensureRow = async () => {
    must(await supabaseAdmin.from(table).upsert({ id: 1 }, { onConflict: 'id', ignoreDuplicates: true }));
  };

  router.use(asyncHandler(async (req, res, next) => {
    await ensureRow();
    next();
  }));

  router.get('/', asyncHandler(async (req, res) => {
    res.json(must(await supabaseAdmin.from(table).select('*').eq('id', 1).single()));
  }));

  router.put('/', asyncHandler(async (req, res) => {
    const data = validate(fields, req.body, { partial: true });
    if (!Object.keys(data).length) throw new HttpError(400, 'Nothing to update.');
    res.json(must(await supabaseAdmin.from(table).update(data).eq('id', 1).select().single()));
  }));

  mountFileRoutes(router, '', { table, files, matchFor: () => ({ id: 1 }) });

  return router;
}
