const { pool } = require('../config/db');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[{ total_users }]]     = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_bookings }]]  = await pool.execute('SELECT COUNT(*) AS total_bookings FROM bookings');
    const [[{ total_providers }]] = await pool.execute('SELECT COUNT(*) AS total_providers FROM provider_profiles WHERE is_active = 1');
    const [[{ total_reports }]]   = await pool.execute("SELECT COUNT(*) AS total_reports FROM reports WHERE status = 'PENDING'");
    const [[{ total_tokens }]]    = await pool.execute("SELECT COALESCE(SUM(amount), 0) AS total_tokens FROM token_transactions WHERE type = 'PURCHASE'");

    const [recentBookings] = await pool.execute(
      `SELECT b.id, b.status, b.agreed_price, b.created_at,
              c.name AS client_name, p.name AS provider_name
       FROM bookings b
       JOIN users c ON c.id = b.client_id
       JOIN users p ON p.id = b.provider_id
       ORDER BY b.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: { total_users, total_bookings, total_providers, pending_reports: total_reports, total_tokens_purchased: total_tokens, recent_bookings: recentBookings },
      message: 'OK',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let sql = 'SELECT id, name, email, phone, role, avatar, status, token_balance, created_at FROM users WHERE 1=1';
    const params = [];

    if (role)   { sql += ' AND role = ?';        params.push(role); }
    if (status) { sql += ' AND status = ?';      params.push(status); }
    if (search) { sql += ' AND name LIKE ?';     params.push(`%${search}%`); }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const setUserStatus = async (req, res, status) => {
  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

    res.json({ success: true, data: { id: parseInt(req.params.id), status }, message: `User status set to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id/warn
const warnUser = (req, res) => setUserStatus(req, res, 'WARNED');

// PATCH /api/admin/users/:id/restrict
const restrictUser = (req, res) => setUserStatus(req, res, 'RESTRICTED');

// PATCH /api/admin/users/:id/suspend
const suspendUser = (req, res) => setUserStatus(req, res, 'SUSPENDED');

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: null, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT r.*,
             reporter.name AS reporter_name,
             reported.name AS reported_user_name
      FROM reports r
      LEFT JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users reported ON reported.id = r.reported_user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/reports/:id
const updateReport = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    const [reports] = await pool.execute('SELECT id FROM reports WHERE id = ?', [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await pool.execute(
      'UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?',
      [status || 'REVIEWED', admin_notes || null, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Report updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/bookings
const getBookings = async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT b.*,
             c.name AS client_name, p.name AS provider_name
      FROM bookings b
      JOIN users c ON c.id = b.client_id
      JOIN users p ON p.id = b.provider_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    sql += ' ORDER BY b.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/bookings/:id/complete
const completeBooking = async (req, res) => {
  try {
    const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await pool.execute("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?", [req.params.id]);

    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Booking marked as completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/tokens
const getTokenStats = async (req, res) => {
  try {
    const [transactions] = await pool.execute(
      `SELECT tt.*, u.name AS user_name
       FROM token_transactions tt
       JOIN users u ON u.id = tt.user_id
       ORDER BY tt.created_at DESC`
    );

    const [[stats]] = await pool.execute(`
      SELECT
        SUM(CASE WHEN type = 'PURCHASE'  THEN amount ELSE 0 END) AS total_purchased,
        SUM(CASE WHEN type = 'DEDUCTION' THEN amount ELSE 0 END) AS total_deducted,
        SUM(CASE WHEN type = 'REWARD'    THEN amount ELSE 0 END) AS total_rewarded
      FROM token_transactions
    `);

    res.json({ success: true, data: { stats, transactions }, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  warnUser,
  restrictUser,
  suspendUser,
  deleteUser,
  getReports,
  updateReport,
  getBookings,
  completeBooking,
  getTokenStats,
};
