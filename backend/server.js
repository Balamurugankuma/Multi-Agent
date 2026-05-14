// ══════════════════════════════════════════════════
//  server.js — Velverse AI Backend Entry Point
//  Node.js + Express + MongoDB + JWT + Razorpay
// ══════════════════════════════════════════════════
require('dotenv').config();

const path        = require('path');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const connectDB   = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aiRoutes      = require('./routes/aiRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const zipRoutes     = require('./routes/zipRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes    = require('./routes/taskRoutes');

// ── Connect to MongoDB ────────────────────────────
connectDB();

const app = express();

// ══════════════════════════════════════════════════
//  GLOBAL MIDDLEWARE
// ══════════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS — allow frontend origin
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Stripe webhook needs RAW body — mount BEFORE express.json() ──
// This is handled inside paymentRoutes with express.raw()

// HTTP request logger (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────
// General API limit: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Auth endpoints: stricter limit (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

// ══════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════
app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/zip',      zipRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);

// ── Health check ──────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Velverse AI + TaskFlow Backend is running',
    version: '4.0',
    features: ['AI Squads','Task Management','Razorpay Payments','JWT Auth','ZIP Download'],
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    }

    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// ── 404 for unknown routes ────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler (must be last) ──────────
app.use(errorHandler);

// ══════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀  Velverse AI Backend running on port ${PORT}`);
  console.log(`📡  Environment : ${process.env.NODE_ENV}`);
  console.log(`🌐  CORS origin : ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`💾  MongoDB     : ${process.env.MONGO_URI?.split('@').pop() || 'localhost'}\n`);
});

// Graceful shutdown on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error(`❌  Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`❌  Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
