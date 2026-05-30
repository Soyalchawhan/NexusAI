/**
 * Input Validation Middleware
 */

const validator = require('validator');

const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address.');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  req.body.name = validator.escape(name.trim());
  req.body.email = validator.normalizeEmail(email);
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

const validateMessage = (req, res, next) => {
  const { message, botType } = req.body;
  const validBots = ['fitness', 'trading', 'study', 'business', 'wellness'];

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message too long. Max 5000 characters.' });
  }
  if (!botType || !validBots.includes(botType)) {
    return res.status(400).json({ error: 'Invalid bot type specified.' });
  }

  req.body.message = message.trim();
  next();
};

module.exports = { validateSignup, validateLogin, validateMessage };
