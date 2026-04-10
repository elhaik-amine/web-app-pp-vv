const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/provider/register
const registerProvider = async (req, res) => {
  try {
    const { name, email, password, phone, avatar, description, city, category_id } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }
    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Avatar image URL is required' });
    }
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (!city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Insert user row
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, 'PROVIDER', avatar]
    );

    const userId = result.insertId;

    // Insert provider_profile row
    await pool.execute(
      `INSERT INTO provider_profiles (user_id, description, city, category_id)
       VALUES (?, ?, ?, ?)`,
      [userId, description, city, category_id || null]
    );

    const accessToken = generateAccessToken(userId);

    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar, u.status, u.token_balance, u.created_at,
              pp.description, pp.city, pp.rating, pp.is_verified
       FROM users u
       JOIN provider_profiles pp ON pp.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      data: { user: rows[0], accessToken },
      message: 'Provider registration successful',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/provider/login
const loginProvider = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const [rows] = await pool.execute(
      `SELECT u.*, pp.description, pp.city, pp.rating, pp.is_verified
       FROM users u
       JOIN provider_profiles pp ON pp.user_id = u.id
       WHERE u.email = ? AND u.role = 'PROVIDER'`,
      [email]
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

module.exports = { registerProvider, loginProvider };
