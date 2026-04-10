const crypto = require('crypto');
const { pool } = require('../config/db');
const { getIO } = require('../socket');

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_SLOTS = ['08:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createNotification = async (userId, type, title, message, data = null) => {
  await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  try {
    getIO().to(`user_${userId}`).emit('notification:new', { type, title, message });
  } catch (_) {}
};

const getBooking = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
  return rows[0] || null;
};

// ─── GET /api/bookings/slots?provider_id=&date= ───────────────────────────────
// Returns available slots for a provider on a date.
// A slot is unavailable if a non-cancelled booking already exists for it.
const getAvailableSlots = async (req, res) => {
  try {
    const { provider_id, date } = req.query;

    if (!provider_id || !date) {
      return res.status(400).json({ success: false, message: 'provider_id and date are required' });
    }

    const [takenRows] = await pool.execute(
      `SELECT time_slot FROM bookings
       WHERE provider_id = ? AND booking_date = ? AND status != 'CANCELLED'`,
      [provider_id, date]
    );

    const takenSlots = takenRows.map((r) => r.time_slot);
    const availableSlots = ALL_SLOTS.filter((slot) => !takenSlots.includes(slot));

    res.json({ success: true, data: { date, available: availableSlots, taken: takenSlots } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings ───────────────────────────────────────────────────────
// Client creates a booking → status: PENDING
const createBooking = async (req, res) => {
  try {
    const { provider_id, booking_date, time_slot, notes } = req.body;

    if (!provider_id || !booking_date || !time_slot) {
      return res.status(400).json({ success: false, message: 'provider_id, booking_date, and time_slot are required' });
    }

    if (!ALL_SLOTS.includes(time_slot)) {
      return res.status(400).json({ success: false, message: `Invalid time slot. Choose from: ${ALL_SLOTS.join(', ')}` });
    }

    const [providers] = await pool.execute(
      `SELECT u.id, u.name FROM users u
       JOIN provider_profiles pp ON pp.user_id = u.id
       WHERE u.id = ? AND u.status = 'ACTIVE' AND pp.is_active = 1`,
      [provider_id]
    );

    if (providers.length === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found or not available' });
    }

    const [result] = await pool.execute(
      `INSERT INTO bookings (client_id, provider_id, booking_date, time_slot, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, provider_id, booking_date, time_slot, notes || null]
    );

    const booking = await getBooking(result.insertId);

    await createNotification(
      provider_id,
      'BOOKING_NEW',
      'New Booking Request',
      `${req.user.name} booked you on ${booking_date} (${time_slot})`,
      { booking_id: booking.id }
    );

    try { getIO().to(`user_${provider_id}`).emit('booking:new', booking); } catch (_) {}

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/bookings ────────────────────────────────────────────────────────
const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const field = req.user.role === 'PROVIDER' ? 'provider_id' : 'client_id';

    let sql = `
      SELECT b.*,
             c.name  AS client_name,   c.phone  AS client_phone,
             p.name  AS provider_name, p.phone  AS provider_phone,
             sc.name AS category_name
      FROM bookings b
      JOIN users c  ON c.id = b.client_id
      JOIN users p  ON p.id = b.provider_id
      LEFT JOIN provider_profiles pp  ON pp.user_id = b.provider_id
      LEFT JOIN service_categories sc ON sc.id = pp.category_id
      WHERE b.${field} = ?
    `;
    const params = [req.user.id];

    if (status) { sql += ' AND b.status = ?'; params.push(status); }

    sql += ' ORDER BY b.booking_date DESC, b.time_slot ASC';

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*,
              c.name  AS client_name,   c.phone  AS client_phone,
              p.name  AS provider_name, p.phone  AS provider_phone,
              sc.name AS category_name
       FROM bookings b
       JOIN users c  ON c.id = b.client_id
       JOIN users p  ON p.id = b.provider_id
       LEFT JOIN provider_profiles pp  ON pp.user_id = b.provider_id
       LEFT JOIN service_categories sc ON sc.id = pp.category_id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/confirm ─────────────────────────────────────────
// Provider confirms → status: CONFIRMED + QR token generated + chat opens
const confirmBooking = async (req, res) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the provider can confirm this booking' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot confirm a booking with status: ${booking.status}` });
    }

    // Generate a unique QR token — frontend turns this into a QR code image
    const qrCode = crypto.randomBytes(32).toString('hex');

    await pool.execute(
      "UPDATE bookings SET status = 'CONFIRMED', qr_code = ? WHERE id = ?",
      [qrCode, booking.id]
    );

    await createNotification(
      booking.client_id,
      'BOOKING_CONFIRMED',
      'Booking Confirmed',
      `Your booking on ${booking.booking_date} (${booking.time_slot}) is confirmed. Chat is now open.`,
      { booking_id: booking.id }
    );

    const updated = await getBooking(booking.id);
    try { getIO().to(`user_${booking.client_id}`).emit('booking:confirmed', updated); } catch (_) {}

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/set-price ───────────────────────────────────────
// Client or provider sets the agreed price after chatting.
// Either party can propose/update the agreed price while booking is CONFIRMED.
const setAgreedPrice = async (req, res) => {
  try {
    const { agreed_price } = req.body;

    if (!agreed_price || agreed_price <= 0) {
      return res.status(400).json({ success: false, message: 'A valid agreed_price is required' });
    }

    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Price can only be set on a confirmed booking' });
    }

    await pool.execute('UPDATE bookings SET agreed_price = ? WHERE id = ?', [agreed_price, booking.id]);

    // Notify the other party about the agreed price
    const notifyId = req.user.id === booking.client_id ? booking.provider_id : booking.client_id;
    await createNotification(
      notifyId,
      'PRICE_AGREED',
      'Price Set',
      `${req.user.name} set the agreed price to ${agreed_price}`,
      { booking_id: booking.id, agreed_price }
    );

    try { getIO().to(`booking_${booking.id}`).emit('booking:price_set', { booking_id: booking.id, agreed_price }); } catch (_) {}

    res.json({ success: true, message: 'Agreed price saved', data: { agreed_price } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/scan-qr ──────────────────────────────────────────
// Client scans the provider's QR code when provider arrives → status: IN_PROGRESS
// The frontend reads the QR token and sends it here.
const scanQR = async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({ success: false, message: 'qr_code is required' });
    }

    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the client can scan the QR code' });
    }
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: `Cannot scan QR on a booking with status: ${booking.status}` });
    }
    if (booking.qr_code !== qr_code) {
      return res.status(400).json({ success: false, message: 'Invalid QR code' });
    }

    await pool.execute("UPDATE bookings SET status = 'IN_PROGRESS' WHERE id = ?", [booking.id]);

    await createNotification(
      booking.provider_id,
      'BOOKING_STARTED',
      'Service Started',
      `${req.user.name} scanned your QR — the service has started`,
      { booking_id: booking.id }
    );

    try { getIO().to(`booking_${booking.id}`).emit('booking:started', { booking_id: booking.id }); } catch (_) {}

    res.json({ success: true, message: 'QR scanned — service is now in progress' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/complete ────────────────────────────────────────
// Provider marks the service as done → status: COMPLETED
const completeBooking = async (req, res) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the provider can complete this booking' });
    }
    if (booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: `Cannot complete a booking with status: ${booking.status}` });
    }

    await pool.execute("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?", [booking.id]);

    await createNotification(
      booking.client_id,
      'BOOKING_COMPLETED',
      'Service Completed',
      `Your booking on ${booking.booking_date} (${booking.time_slot}) is completed. Please leave a review.`,
      { booking_id: booking.id }
    );

    res.json({ success: true, message: 'Booking completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
// Client or provider can cancel — only from PENDING or CONFIRMED
const cancelBooking = async (req, res) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking with status: ${booking.status}` });
    }

    await pool.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [booking.id]);

    const notifyId = req.user.id === booking.client_id ? booking.provider_id : booking.client_id;
    await createNotification(
      notifyId,
      'BOOKING_CANCELLED',
      'Booking Cancelled',
      `Booking on ${booking.booking_date} (${booking.time_slot}) was cancelled`,
      { booking_id: booking.id }
    );

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/review ───────────────────────────────────────────
// Client reviews after COMPLETED
const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the client can leave a review' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    await pool.execute(
      'INSERT INTO reviews (booking_id, client_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking.id, booking.client_id, booking.provider_id, rating, comment || null]
    );

    // Recalculate provider rating
    const [ratingRows] = await pool.execute(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM reviews WHERE provider_id = ?',
      [booking.provider_id]
    );
    await pool.execute(
      'UPDATE provider_profiles SET rating = ?, total_reviews = ? WHERE user_id = ?',
      [ratingRows[0].avg_rating, ratingRows[0].total, booking.provider_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'You already reviewed this booking' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAvailableSlots,
  createBooking,
  getBookings,
  getBookingById,
  confirmBooking,
  setAgreedPrice,
  scanQR,
  cancelBooking,
  completeBooking,
  createReview,
};
