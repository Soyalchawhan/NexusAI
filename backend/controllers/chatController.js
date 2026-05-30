/**
 * Chat Controller
 */

const Message    = require('../models/Message');
const Session    = require('../models/Session');
const aiService  = require('../services/aiService');

/**
 * POST /api/chat/ask  (PUBLIC — no auth required)
 * Body: { message, botType, history[] }
 * Returns: { reply }
 *
 * The frontend sends the full conversation history so the AI has context.
 * Nothing is stored in the database — storage lives in the frontend (localStorage).
 */
exports.ask = async (req, res, next) => {
  try {
    const { message, botType, history = [] } = req.body;

    const validBots = ['fitness', 'trading', 'study', 'business', 'wellness'];
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (!botType || !validBots.includes(botType)) {
      return res.status(400).json({ error: 'Invalid bot type.' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long. Max 5000 characters.' });
    }

    // Build history for AI — last 20 messages for context window
    const contextHistory = [
      ...history.slice(-20).map(m => ({
        role:    m.role === 'bot' ? 'assistant' : m.role,
        content: m.content
      })),
      { role: 'user', content: message.trim() }
    ];

    const result = await aiService.getResponse(botType, contextHistory);

    res.json({ reply: result.content });
  } catch (err) {
    console.error('[ask error]', err.message);
    // Send a user-friendly error, not a stack trace
    res.status(500).json({ error: err.message || 'AI service error. Please try again.' });
  }
};

/**
 * POST /api/chat/message  (PROTECTED — saves to MongoDB)
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, botType, sessionId } = req.body;
    const userId = req.user._id;

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId });
      if (!session) return res.status(404).json({ error: 'Session not found.' });
    } else {
      session = await Session.create({ userId, botType });
    }

    await Message.create({ sessionId: session._id, userId, botType, role: 'user', content: message });

    const history = await Message.find({ sessionId: session._id })
      .sort({ createdAt: 1 }).limit(20).select('role content');

    const formattedHistory = history.map(m => ({ role: m.role, content: m.content }));
    const result = await aiService.getResponse(botType, formattedHistory);

    const savedResponse = await Message.create({
      sessionId: session._id, userId, botType,
      role: 'assistant', content: result.content,
      tokens: { input: result.inputTokens, output: result.outputTokens }
    });

    await Session.findByIdAndUpdate(session._id, {
      $inc: { messageCount: 2, totalTokensUsed: result.inputTokens + result.outputTokens },
      lastMessageAt: new Date(),
      ...(session.messageCount === 0 && {
        title: message.substring(0, 80) + (message.length > 80 ? '...' : '')
      })
    });

    res.json({
      message: { id: savedResponse._id, content: result.content, role: 'assistant', createdAt: savedResponse.createdAt },
      sessionId: session._id
    });
  } catch (err) { next(err); }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { botType, limit = 20, page = 1 } = req.query;
    const filter = { userId: req.user._id, isActive: true };
    if (botType) filter.botType = botType;
    const sessions = await Session.find(filter).sort({ lastMessageAt: -1 })
      .limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const total = await Session.countDocuments(filter);
    res.json({ sessions, total, page: Number(page), totalPages: Math.ceil(total/limit) });
  } catch (err) { next(err); }
};

exports.createSession = async (req, res, next) => {
  try {
    const { botType } = req.body;
    const session = await Session.create({ userId: req.user._id, botType });
    res.status(201).json({ session });
  } catch (err) { next(err); }
};

exports.getSessionMessages = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const messages = await Message.find({ sessionId: session._id }).sort({ createdAt: 1 }).select('-__v');
    res.json({ session, messages });
  } catch (err) { next(err); }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, { isActive: false }
    );
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json({ message: 'Session deleted.' });
  } catch (err) { next(err); }
};

exports.rateMessage = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, userId: req.user._id, role: 'assistant' },
      { rating, feedback }, { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found.' });
    res.json({ message: 'Rating saved.', data: message });
  } catch (err) { next(err); }
};
