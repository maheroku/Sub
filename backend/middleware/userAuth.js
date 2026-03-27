const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-in-production';
const TOKEN_EXPIRY = '365d';

const generateUserToken = (userId) => {
  return jwt.sign(
    { userId, type: 'user' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const verifyUserToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'user') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

const resolveUser = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const decoded = verifyUserToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return null;
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return null;
    }
    return user;
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication error' });
    return null;
  }
};

const userAuthMiddleware = async (req, res, next) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  req.user = user;
  next();
};

module.exports = {
  generateUserToken,
  verifyUserToken,
  resolveUser,
  userAuthMiddleware
};
