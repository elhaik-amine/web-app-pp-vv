const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { syncNoShowDisputes } = require('../utils/noShowDisputes');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[{ total_users }]]     = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_bookings }]]  = await pool.execute('SELECT COUNT(*) AS total_bookings FROM bookings');
    const [[{ total_providers }]] = await pool.execute('SELECT COUNT(*) AS total_providers FROM provider_profiles WHERE is_active = 1');
    const [[{ total_reports }]]   = await pool.execute("SELECT COUNT(*) AS total_reports FROM reports WHERE status IN ('PENDING', 'PENDING_REVIEW', 'UNDER_ADMIN_REVIEW')");
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

// POST /api/admin/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'ADMIN']);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = generateAccessToken(user.id);

    res.json({
      success: true,
      data: { role: user.role, token },
      message: 'Admin login successful',
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
const suspendUser = async (req, res) => {
  try {
    const { days } = req.body; // number of days, optional (omit = indefinite)
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let suspendedUntil = null;
    if (days && Number(days) > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + Number(days));
    }

    await pool.execute(
      'UPDATE users SET status = ?, suspended_until = ? WHERE id = ?',
      ['SUSPENDED', suspendedUntil, req.params.id]
    );

    res.json({
      success: true,
      data: { id: parseInt(req.params.id), status: 'SUSPENDED', suspended_until: suspendedUntil },
      message: days ? `User suspended for ${days} day(s)` : 'User suspended indefinitely',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id  →  soft-ban (keeps FK integrity)
const deleteUser = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.execute("UPDATE users SET status = 'BANNED' WHERE id = ?", [req.params.id]);
    res.json({ success: true, data: null, message: 'User banned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id/activate  →  lift suspension
const activateUser = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await pool.execute(
      "UPDATE users SET status = 'ACTIVE', suspended_until = NULL WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, data: { id: parseInt(req.params.id), status: 'ACTIVE' }, message: 'User reactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    await syncNoShowDisputes(pool);

    const { status } = req.query;

    let sql = `
      SELECT r.*,
             reporter.name AS reporter_name,
             reporter.email AS reporter_email,
             reporter.phone AS reporter_phone,
             reporter.role AS reporter_role,
             reported.name AS reported_user_name,
             reported.email AS reported_user_email,
             reported.phone AS reported_user_phone,
             reported.role AS reported_user_role,
             b.client_id,
             b.provider_id,
             b.date_meeting,
             b.time_slot,
             b.status AS booking_status,
             b.estimated_price,
             b.agreed_price,
             b.notes AS booking_notes,
             b.qr_active_from,
             b.qr_active_until,
             b.created_at AS booking_created_at,
             client.name AS client_name,
             client.email AS client_email,
             client.phone AS client_phone,
             provider.name AS provider_name,
             provider.email AS provider_email,
             provider.phone AS provider_phone
      FROM reports r
      LEFT JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users reported ON reported.id = r.reported_user_id
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN users client ON client.id = b.client_id
      LEFT JOIN users provider ON provider.id = b.provider_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    const bookingIds = [...new Set(rows.map((row) => row.booking_id).filter(Boolean))];

    let photosByBooking = {};
    if (bookingIds.length > 0) {
      const placeholders = bookingIds.map(() => '?').join(',');
      const [photoRows] = await pool.execute(
        `SELECT bp.id, bp.booking_id, bp.uploaded_by, bp.type, bp.url, bp.description, bp.sort_order, bp.created_at,
                uploader.name AS uploaded_by_name,
                uploader.role AS uploaded_by_role
         FROM booking_photos bp
         LEFT JOIN users uploader ON uploader.id = bp.uploaded_by
         WHERE bp.booking_id IN (${placeholders})
         ORDER BY bp.booking_id, bp.type, bp.sort_order, bp.created_at`,
        bookingIds
      );

      photosByBooking = photoRows.reduce((acc, photo) => {
        if (!acc[photo.booking_id]) {
          acc[photo.booking_id] = { before: [], after: [] };
        }

        const normalizedPhoto = {
          id: photo.id,
          url: photo.url,
          description: photo.description,
          sort_order: photo.sort_order,
          uploaded_by: photo.uploaded_by,
          uploaded_by_name: photo.uploaded_by_name,
          uploaded_by_role: photo.uploaded_by_role,
          created_at: photo.created_at,
        };

        if (photo.type === 'BEFORE') {
          acc[photo.booking_id].before.push(normalizedPhoto);
        } else if (photo.type === 'AFTER') {
          acc[photo.booking_id].after.push(normalizedPhoto);
        }

        return acc;
      }, {});
    }

    const data = rows.map((row) => ({
      ...row,
      booking: row.booking_id ? {
        id: row.booking_id,
        status: row.booking_status,
        date_meeting: row.date_meeting,
        time_slot: row.time_slot,
        estimated_price: row.estimated_price,
        agreed_price: row.agreed_price,
        notes: row.booking_notes,
        qr_active_from: row.qr_active_from,
        qr_active_until: row.qr_active_until,
        created_at: row.booking_created_at,
        client: {
          id: row.client_id,
          name: row.client_name,
          email: row.client_email,
          phone: row.client_phone,
        },
        provider: {
          id: row.provider_id,
          name: row.provider_name,
          email: row.provider_email,
          phone: row.provider_phone,
        },
        photos: photosByBooking[row.booking_id] || { before: [], after: [] },
      } : null,
      evidence: {
        photo_url: row.evidence_photo_url,
        latitude: row.evidence_latitude,
        longitude: row.evidence_longitude,
        captured_at: row.evidence_captured_at,
      },
    }));

    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/reports/:id
const updateReport = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    const [reports] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = reports[0];
    const nextStatus = status || 'RESOLVED';
    const isFinalStatus = ['RESOLVED', 'REJECTED', 'AUTO_RESOLVED'].includes(nextStatus);

    if (report.type === 'NOSHOW' && report.booking_id) {
      await pool.execute(
        `UPDATE reports
         SET status = ?, admin_notes = ?, resolved_at = ?, resolution_reason = COALESCE(resolution_reason, ?)
         WHERE booking_id = ? AND type = 'NOSHOW'`,
        [
          nextStatus,
          admin_notes || null,
          isFinalStatus ? new Date() : null,
          admin_notes || null,
          report.booking_id,
        ]
      );

      if (nextStatus === 'RESOLVED') {
        await pool.execute(
          `UPDATE bookings
           SET status = 'CANCELLED'
           WHERE id = ? AND status = 'CONFIRMED'`,
          [report.booking_id]
        );
      }
    } else {
      await pool.execute(
        'UPDATE reports SET status = ?, admin_notes = ?, resolved_at = ? WHERE id = ?',
        [nextStatus, admin_notes || null, isFinalStatus ? new Date() : null, req.params.id]
      );
    }

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
  activateUser,
  deleteUser,
  getReports,
  updateReport,
  getBookings,
  completeBooking,
  getTokenStats,
  loginAdmin,
};
