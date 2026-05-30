/**
 * Socket.io Service — Real-Time Chat Handler
 */

const jwt = require('jsonwebtoken');
const aiService = require('./aiService');
const Message = require('../models/Message');
const Session = require('../models/Session');

const setupSocketHandlers = (io) => {
  // JWT Authentication for Socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required.'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // ---- Handle Chat Message with Streaming ----
    socket.on('chat:message', async ({ message, botType, sessionId }) => {
      try {
        // Get or create session
        let session;
        if (sessionId) {
          session = await Session.findOne({ _id: sessionId, userId: socket.userId });
        }
        if (!session) {
          session = await Session.create({ userId: socket.userId, botType });
        }

        // Save user message
        await Message.create({
          sessionId: session._id,
          userId: socket.userId,
          botType,
          role: 'user',
          content: message
        });

        // Get history
        const history = await Message.find({ sessionId: session._id })
          .sort({ createdAt: 1 })
          .limit(20)
          .select('role content');

        // Emit start event
        socket.emit('chat:start', { sessionId: session._id });

        // Stream response
        let fullResponse = '';

        fullResponse = await aiService.streamResponse(
          botType,
          history.map(m => ({ role: m.role, content: m.content })),
          (chunk) => {
            socket.emit('chat:chunk', { chunk });
          }
        );

        // Save assistant message
        const savedMsg = await Message.create({
          sessionId: session._id,
          userId: socket.userId,
          botType,
          role: 'assistant',
          content: fullResponse
        });

        // Update session
        await Session.findByIdAndUpdate(session._id, {
          $inc: { messageCount: 2 },
          lastMessageAt: new Date()
        });

        // Emit completion
        socket.emit('chat:done', {
          messageId: savedMsg._id,
          sessionId: session._id
        });

      } catch (err) {
        console.error('Socket chat error:', err);
        socket.emit('chat:error', { error: 'Failed to process message.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
