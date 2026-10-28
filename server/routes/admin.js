import express from 'express';
import { crudRouter, singletonRouter } from './crud.js';
import { listResources, singletonResources } from './resources.js';
import sectionsRouter from './sections.js';
import messagesRouter from './messages.js';
import statsRouter from './stats.js';
import accountRouter from './account.js';
import uiTextRouter from './uiText.js';

// Every route here is mounted behind requireAdmin (see index.js).
const router = express.Router();

router.use('/stats', statsRouter);
router.use('/messages', messagesRouter);
router.use('/sections', sectionsRouter);
router.use('/account', accountRouter);
router.use('/ui_text', uiTextRouter);

for (const [table, config] of Object.entries(singletonResources)) {
  router.use(`/${table}`, singletonRouter({ table, ...config }));
}

for (const [table, config] of Object.entries(listResources)) {
  router.use(`/${table}`, crudRouter({ table, ...config }));
}

export default router;
