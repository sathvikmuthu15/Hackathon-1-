// Cantina Cuhh backend proxy.
// Privacy rules: never log request bodies, images, transcripts or keys.
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { providerStatus } from '../ai/provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_MB) || 6;
// base64 inflates by ~4/3; allow a little headroom for the JSON wrapper.
const BODY_LIMIT = `${Math.ceil(MAX_IMAGE_MB * 1.4) + 1}mb`;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: BODY_LIMIT }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'rate_limited' },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: providerStatus() });
});

// AI routes are added in Module 2 (reader) and Module 3 (forms).
app.use('/api/ai', aiLimiter);

// Serve the built client in production (`npm run build && npm start`).
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));

// Errors: report a code only, never the body or the provider's raw message.
app.use((err, _req, res, _next) => {
  const code = err.type === 'entity.too.large' ? 'image_too_large' : 'server_error';
  console.error(`[error] ${code}`);
  res.status(err.status || 500).json({ error: code });
});

app.listen(PORT, () => {
  const s = providerStatus();
  console.log(`Cantina Cuhh API on http://localhost:${PORT}`);
  console.log(`AI provider: ${s.provider} | configured: ${s.configured}${s.problem ? ` (${s.problem})` : ''}`);
});
