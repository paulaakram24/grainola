import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { uploadsDir } from './config/multer';
import { errorHandler, notFound } from './middleware/error.middleware';
// Note: no Redis import — job processing is in-process via processor.service.ts
import authRoutes         from './routes/auth.routes';
import folderRoutes       from './routes/folder.routes';
import meetingRoutes      from './routes/meeting.routes';
import uploadRoutes       from './routes/upload.routes';
import calendarRoutes     from './routes/calendar.routes';
import searchRoutes       from './routes/search.routes';
import subscriptionRoutes from './routes/subscription.routes';

const app = express();

// ── Security & Compression ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(compression());

// ── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints — prevents brute force but lenient enough
// not to lock out a legitimate user/demo retry. Returns a clear message so the
// frontend can surface "too many attempts" instead of a generic failure.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many attempts — please wait a few minutes and try again.' },
});
app.use('/api/v1/auth/login',    authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Bound how often a refresh token can be exchanged.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts.' },
});
app.use('/api/v1/auth/refresh', refreshLimiter);

// Per-user upload throttle. Combined with the per-plan recording cap this
// keeps a stolen access token from filling the disk with 200 MB blobs.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload rate limit reached — try again in an hour.' },
});
app.use('/api/v1/recordings/upload', uploadLimiter);

// ── Static uploads ────────────────────────────────────────────────────────────
// Allow cross-origin audio/video playback (helmet's COrP defaults to same-origin
// which blocks <audio> on a different port). Also force audio/* MIME types so
// .webm recordings made by MediaRecorder play back as audio in <audio> elements.
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.webm')) res.setHeader('Content-Type', 'audio/webm');
      else if (lower.endsWith('.ogg')) res.setHeader('Content-Type', 'audio/ogg');
      else if (lower.endsWith('.m4a')) res.setHeader('Content-Type', 'audio/mp4');
      else if (lower.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
      else if (lower.endsWith('.wav')) res.setHeader('Content-Type', 'audio/wav');
    },
  }),
);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── API Routes ────────────────────────────────────────────────────────────────
const V1 = '/api/v1';
app.use(`${V1}/auth`,         authRoutes);
app.use(`${V1}/folders`,      folderRoutes);
app.use(`${V1}/meetings`,     meetingRoutes);
app.use(`${V1}/recordings`,   uploadRoutes);
app.use(`${V1}/calendar`,     calendarRoutes);
app.use(`${V1}/search`,       searchRoutes);
app.use(`${V1}/subscription`, subscriptionRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
