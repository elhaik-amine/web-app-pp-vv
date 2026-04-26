const { pool } = require('../config/db');
const { syncNoShowDisputes } = require('../utils/noShowDisputes');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    await syncNoShowDisputes(pool);

    const {
      reported_user_id,
      booking_id,
      type,
      description,
      evidence_photo_url,
      evidence_latitude,
      evidence_longitude,
      evidence_captured_at,
    } = req.body;

    if (!type || !['NOSHOW', 'ABSENT', 'OTHER'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be NOSHOW, ABSENT or OTHER' });
    }

    const [result] = await pool.execute(
      `INSERT INTO reports (
         reporter_id, reported_user_id, booking_id, type, description,
         evidence_photo_url, evidence_latitude, evidence_longitude, evidence_captured_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        reported_user_id || null,
        booking_id || null,
        type,
        description || null,
        evidence_photo_url || null,
        evidence_latitude || null,
        evidence_longitude || null,
        evidence_captured_at || null,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, data: rows[0], message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports  (returns reports filed by or against the current user)
const getReports = async (req, res) => {
  try {
    await syncNoShowDisputes(pool);

    const [rows] = await pool.execute(
      `SELECT r.*,
              reporter.name AS reporter_name,
              reported.name AS reported_user_name,
              b.date_meeting,
              b.time_slot,
              b.status AS booking_status
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users reported ON reported.id = r.reported_user_id
       LEFT JOIN bookings b ON b.id = r.booking_id
       WHERE r.reporter_id = ? OR r.reported_user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReport, getReports };
