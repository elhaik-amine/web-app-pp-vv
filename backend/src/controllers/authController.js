const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { pool }  = require('../config/db');
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/logout  (stateless — client discards the token)
const logout = async (req, res) => {
  res.json({ success: true, data: null, message: 'Logged out successfully' });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [rows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);

    // Always return the same response so we don't reveal whether the email exists
    if (rows.length === 0) {
      return res.json({ success: true, data: null, message: 'If that email exists, a reset link was sent' });
    }

    const user = rows[0];

    // Token is a JWT that embeds the user's email — self-verifying and self-expiring
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const expires    = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, expires, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset your Khidmati password',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    res.json({ success: true, data: null, message: 'If that email exists, a reset link was sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // Decode the JWT to extract the email embedded inside it
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Confirm the token is still stored for that email (single-use protection)
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND reset_token = ?',
      [decoded.email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );

    res.json({ success: true, data: null, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logout, forgotPassword, resetPassword };
