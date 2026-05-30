/**
 * Authentication Routes
 * POST /api/auth/signup
 * POST /api/auth/login
 * GET  /api/auth/me
 * PUT  /api/auth/preferences
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', protect, authController.getMe);
router.put('/preferences', protect, authController.updatePreferences);

module.exports = router;
