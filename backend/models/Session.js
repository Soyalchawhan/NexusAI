/**
 * Session Model — MongoDB Schema
 * Represents a single chat conversation session
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 120
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, botType: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
