const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  try {
  } catch (error) {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };
