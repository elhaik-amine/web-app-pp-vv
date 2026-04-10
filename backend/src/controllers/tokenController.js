const { pool } = require('../config/db');
const { getIO } = require('../socket');

// GET /api/tokens/balance
const getBalance = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT token_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, data: { balance: rows[0].token_balance }, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tokens/history
const getHistory = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tokens/buy
const buyTokens = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    await pool.execute(
      'UPDATE users SET token_balance = token_balance + ? WHERE id = ?',
      [amount, req.user.id]
    );

    await pool.execute(
      `INSERT INTO token_transactions (user_id, type, amount, description)
       VALUES (?, 'PURCHASE', ?, 'Token purchase')`,
      [req.user.id, amount]
    );

    const [rows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [req.user.id]);

    try {
      getIO().to(`user_${req.user.id}`).emit('token:updated', { type: 'PURCHASE', amount, balance: rows[0].token_balance });
    } catch (_) {}

    res.json({
      success: true,
      data: { new_balance: rows[0].token_balance },
      message: `${amount} token(s) purchased successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBalance, getHistory, buyTokens };
