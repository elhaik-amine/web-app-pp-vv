const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Verify JWT and attach user to req
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, status, token_balance FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Check if user has one of the allowed roles
const role = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
    }
    next();
  };
};

// Block suspended accounts
const restricted = (req, res, next) => {
  if (req.user.status === 'SUSPENDED') {
    return res.status(403).json({ success: false, message: 'Your account has been suspended' });
  }
  next();
};

module.exports = { protect, role, restricted };
