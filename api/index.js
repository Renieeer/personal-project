// Vercel function: the whole Express API (server/app.js).
// vercel.json rewrites every /api/* request here; Express sees the original URL.
import app from '../server/app.js';

export default app;
