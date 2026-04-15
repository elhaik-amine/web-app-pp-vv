const { pool } = require('../config/db');
const { getIO } = require('../socket');

const getBookingForUser = async (bookingId, userId) => {
  const [rows] = await pool.execute(
    'SELECT b.*, u.name as client_name, p.name as provider_name FROM bookings b JOIN users u ON u.id = b.client_id JOIN users p ON p.id = b.provider_id WHERE b.id = ?',
    [bookingId]
  );
  if (rows.length === 0) return null;
  const booking = rows[0];
  if (booking.client_id !== userId && booking.provider_id !== userId) return null;
  return booking;
};

// GET messages
const getMessages = async (req, res) => {
  try {
    const booking = await getBookingForUser(req.params.bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or access denied' });
    }

    const [messages] = await pool.execute(
      `SELECT m.id, m.content, m.created_at, m.is_negotiation, m.proposed_price,
              u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.booking_id = ?
       ORDER BY m.created_at ASC`,
      [booking.id]
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages };