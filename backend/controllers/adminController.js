/**
 * Admin Controller — Analytics & Management
 */

const User = require('../models/User');
const Message = require('../models/Message');
const Session = require('../models/Session');

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalMessages, totalSessions, activeSessions] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      Session.countDocuments(),
      Session.countDocuments({ isActive: true })
    ]);

    // Messages per bot type
    const botStats = await Message.aggregate([
      { $group: { _id: '$botType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // New users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Daily message volume (last 7 days)
    const dailyMessages = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      overview: { totalUsers, totalMessages, totalSessions, activeSessions, newUsersThisWeek },
      botStats,
      dailyMessages
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-password');

    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email')
      .select('botType role createdAt userId');

    res.json({ activity: messages });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};
