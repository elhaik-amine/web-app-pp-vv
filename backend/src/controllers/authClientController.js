const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/client/register
const registerClient = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, 'CLIENT']
    );

    const userId = result.insertId;
    const accessToken = generateAccessToken(userId);

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, avatar, status, token_balance, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      data: { user: rows[0], accessToken },
      message: 'Registration successful',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/client/login
const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, 'CLIENT']
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    const accessToken = generateAccessToken(user.id);

    const { password: _, reset_token: __, reset_token_expires: ___, ...safeUser } = user;

    res.json({
      success: true,
      data: { user: safeUser, accessToken },
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerClient, loginClient };
