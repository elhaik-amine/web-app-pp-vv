const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, avatar, status, token_balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const { name, phone, password, avatar } = req.body;

    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (phone) { fields.push('phone = ?'); values.push(phone); }
    if (avatar) { fields.push('avatar = ?'); values.push(avatar); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, avatar, status, token_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, data: rows[0], message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/me
const deleteMe = async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: null, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar, u.status, u.created_at,
              pp.description, pp.city, pp.rating, pp.total_reviews, pp.is_verified
       FROM users u
       LEFT JOIN provider_profiles pp ON pp.user_id = u.id
       WHERE u.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMe, updateMe, deleteMe, getUserById };
