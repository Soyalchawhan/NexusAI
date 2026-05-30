/**
 * Chat Routes
 *
 * Public:
 *   POST /api/chat/ask          — Send message, get AI reply (no auth needed)
 *
 * Protected (requires JWT):
 *   POST   /api/chat/message        — Send + save message to session
 *   GET    /api/chat/sessions       — List user sessions
 *   POST   /api/chat/sessions       — Create session
 *   GET    /api/chat/sessions/:id   — Get session messages
 *   DELETE /api/chat/sessions/:id   — Delete session
 */

const express  = require('express');
const router   = express.Router();
const rateLimit = require('express-rate-limit');
const { protect }        = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const chatController      = require('../controllers/chatController');

// Rate limiter for AI calls — 30 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please slow down.' }
});

// ---- PUBLIC ROUTE — no login required ----
router.post('/ask', chatLimiter, chatController.ask);

// ---- PROTECTED ROUTES — JWT required ----
router.use(protect);
router.post('/message',          chatLimiter, validateMessage, chatController.sendMessage);
router.get('/sessions',          chatController.getSessions);
router.post('/sessions',         chatController.createSession);
router.get('/sessions/:id',      chatController.getSessionMessages);
router.delete('/sessions/:id',   chatController.deleteSession);
router.post('/message/:messageId/rate', chatController.rateMessage);

module.exports = router;
