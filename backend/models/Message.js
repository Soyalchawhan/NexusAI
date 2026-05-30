/**
 * Message Model — MongoDB Schema
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  botType: {
    type: String,
    enum: ['fitness', 'trading', 'study', 'business', 'wellness'],
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [10000, 'Message too long']
  },
  tokens: {
    input: { type: Number, default: 0 },
    output: { type: Number, default: 0 }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient conversation retrieval
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, botType: 1 });

module.exports = mongoose.model('Message', messageSchema);
