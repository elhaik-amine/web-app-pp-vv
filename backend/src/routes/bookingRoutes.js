const express = require('express');
const router = express.Router();
const messageRoutes = require('./messageRoutes');
const { pool } = require('../config/db');
const { getIO } = require('../socket');
const {
  getAvailableSlots,
  createBooking,
  getBookings,
  getBookingById,
  confirmBooking,
  acceptPrice,
  rejectPrice,
  setAgreedPrice,
  rejectBookingOffer,
  scanQR,
  cancelBooking,
  completeBooking,
  createReview,
} = require('../controllers/bookingController');
const { protect, role, restricted } = require('../middlewares/authMiddleware');

// Helper function
const getBookingForUser = async (bookingId, userId) => {
  const [rows] = await pool.execute(
    `SELECT b.*, c.name as client_name, p.name as provider_name 
     FROM bookings b 
     JOIN users c ON c.id = b.client_id 
     JOIN users p ON p.id = b.provider_id 
     WHERE b.id = ? AND (b.client_id = ? OR b.provider_id = ?)`,
    [bookingId, userId, userId]
  );
  return rows[0] || null;
};

// Helper function for notifications
const createNotification = async (userId, type, title, message, data = null) => {
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  
  const payload = {
    id: result.insertId,
    type,
    title,
    message,
    data: data || {},
    created_at: new Date()
  };
  
  try {
    getIO().to(`user_${userId}`).emit('notification:new', payload);
  } catch (_) {}
};

router.get('/slots', protect, restricted, getAvailableSlots);

router.post('/',   protect, restricted, role('CLIENT'),   createBooking);
router.get('/',    protect, restricted,                   getBookings);
router.get('/:id', protect, restricted,                   getBookingById);

router.patch('/:id/confirm',     protect, restricted, role('PROVIDER'), confirmBooking);
router.post('/:id/accept-price', protect, restricted,                   acceptPrice);
router.post('/:id/reject-price', protect, restricted,                   rejectPrice);
router.patch('/:id/set-price',   protect, restricted,                   setAgreedPrice);
router.patch('/:id/reject',      protect, restricted,                   rejectBookingOffer);
// FIXED: Changed from CLIENT to PROVIDER
router.post('/:id/scan-qr',      protect, restricted, role('PROVIDER'), scanQR);
router.patch('/:id/complete',    protect, restricted, role('PROVIDER'), completeBooking);
router.patch('/:id/cancel',      protect, restricted,                   cancelBooking);
router.post('/:id/review',       protect, restricted, role('CLIENT'),   createReview);

// OFFER ROUTE
router.post('/:id/offer', protect, restricted, async (req, res) => {
  try {
    const { proposed_price } = req.body;
    const bookingId = req.params.id;

    if (!proposed_price || proposed_price <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price required' });
    }

    const booking = await getBookingForUser(bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Cannot negotiate on this booking' });
    }

    const [roundsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE booking_id = ? AND sender_id = ? AND is_negotiation = 1',
      [bookingId, req.user.id]
    );
    
    if (roundsCount[0].count >= 3) {
      return res.status(400).json({ success: false, message: 'Vous avez utilisé vos 3 rounds de négociation' });
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (booking_id, sender_id, content, is_negotiation, proposed_price, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [bookingId, req.user.id, `Proposition: ${proposed_price} MAD`, 1, proposed_price]
    );

    await pool.execute('UPDATE bookings SET estimated_price = ?, agreed_price = ? WHERE id = ?', 
      [proposed_price, proposed_price, bookingId]);

    const [msgRows] = await pool.execute(
      `SELECT m.id, m.content, m.created_at, m.is_negotiation, m.proposed_price,
              u.id AS sender_id, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const message = msgRows[0];
    const otherUserId = booking.client_id === req.user.id ? booking.provider_id : booking.client_id;
    
    await createNotification(
      otherUserId,
      'NEGOTIATION',
      'Nouvelle offre de prix',
      `${req.user.name} vous propose ${proposed_price} MAD`,
      { booking_id: bookingId, proposed_price }
    );

    const io = getIO();
    io.to(`booking_${bookingId}`).emit('negotiation:new', message);
    io.to(`user_${otherUserId}`).emit('notification:new', {
      type: 'NEGOTIATION',
      title: 'Nouvelle offre de prix',
      message: `${req.user.name} vous propose ${proposed_price} MAD`,
      data: { booking_id: bookingId }
    });

    res.json({ success: true, message: 'Offer sent', data: message });
  } catch (error) {
    console.error('Offer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use('/:bookingId/messages', messageRoutes);

module.exports = router;