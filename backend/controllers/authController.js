/**
 * Authentication Controller
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { theme, defaultBot, chatbotName } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'preferences.theme': theme,
          'preferences.defaultBot': defaultBot,
          'preferences.chatbotName': chatbotName
        }
      },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Preferences updated.', user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};
