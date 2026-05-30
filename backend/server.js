
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
const httpServer = http.createServer(app);

// ---- Socket.io Setup ----
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'https://nexus-ai-phi-hazel.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ---- Database Connection ----
connectDB();

// ---- Middleware ----
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://nexus-ai-phi-hazel.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Global Rate Limiter ----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use(globalLimiter);

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NexusAI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ---- Socket.io Real-Time Chat ----
const { setupSocketHandlers } = require('./services/socketService');
setupSocketHandlers(io);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 NexusAI Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
