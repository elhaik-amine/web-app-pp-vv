const { pool } = require('../config/db');
const { getIO } = require('../socket');

// helper — verify the user is the client or provider of the booking
const getBookingForUser = async (bookingId, userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM bookings WHERE id = ?',
    [bookingId]
  );
  if (rows.length === 0) return null;
  const booking = rows[0];
  if (booking.client_id !== userId && booking.provider_id !== userId) return null;
  return booking;
};

// ─── GET /api/bookings/:bookingId/messages ────────────────────────────────────
// Fetch all messages for a booking. Also marks unread messages as read.
const getMessages = async (req, res) => {
  try {
    const booking = await getBookingForUser(req.params.bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or access denied' });
    }

    const [messages] = await pool.execute(
      `SELECT m.id, m.content, m.is_read, m.created_at,
              u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.booking_id = ?
       ORDER BY m.created_at ASC`,
      [booking.id]
    );

    // Mark messages sent by the OTHER party as read
    await pool.execute(
      `UPDATE messages SET is_read = 1
       WHERE booking_id = ? AND sender_id != ? AND is_read = 0`,
      [booking.id, req.user.id]
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:bookingId/messages ───────────────────────────────────
// Send a message. Only allowed when booking is PENDING or CONFIRMED.
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const booking = await getBookingForUser(req.params.bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or access denied' });
    }

    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot send messages on a booking that is cancelled or completed' });
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (booking_id, sender_id, content) VALUES (?, ?, ?)',
      [booking.id, req.user.id, content.trim()]
    );

    const [rows] = await pool.execute(
      `SELECT m.id, m.content, m.is_read, m.created_at,
              u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const message = rows[0];

    // Emit to both participants via their booking room
    try {
      getIO().to(`booking_${booking.id}`).emit('message:new', message);
    } catch (_) {}

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
