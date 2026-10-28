import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { requireAdmin } from './middleware/auth.js';
import { HttpError } from './lib/http.js';

if (!process.env.ADMIN_EMAIL) {
  console.error('Missing ADMIN_EMAIL. Set it in server/.env to the email of your Supabase admin user.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '200kb' }));

app.use('/api', publicRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Optional: serve the built React app from the same origin.
if (process.env.SERVE_CLIENT === 'true') {
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (err instanceof HttpError) {
    if (err.status >= 500) console.error(err.cause || err);
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
