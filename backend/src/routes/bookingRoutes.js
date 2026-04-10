const express = require('express');
const router = express.Router();
const messageRoutes = require('./messageRoutes');
const {
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
} = require('../controllers/bookingController');
const { protect, role, restricted } = require('../middlewares/authMiddleware');

router.get('/slots', protect, restricted, getAvailableSlots);

router.post('/',   protect, restricted, role('CLIENT'),   createBooking);
router.get('/',    protect, restricted,                   getBookings);
router.get('/:id', protect, restricted,                   getBookingById);

router.patch('/:id/confirm',     protect, restricted, role('PROVIDER'), confirmBooking);  // PENDING   → CONFIRMED + QR generated
router.patch('/:id/set-price',   protect, restricted,                   setAgreedPrice); // set agreed_price while CONFIRMED
router.post('/:id/scan-qr',      protect, restricted, role('CLIENT'),   scanQR);         // CONFIRMED → IN_PROGRESS (client scans QR on provider arrival)
router.patch('/:id/complete',    protect, restricted, role('PROVIDER'), completeBooking); // IN_PROGRESS → COMPLETED
router.patch('/:id/cancel',      protect, restricted,                   cancelBooking);  // PENDING or CONFIRMED → CANCELLED

router.post('/:id/review', protect, restricted, role('CLIENT'), createReview);

// Nested chat — /api/bookings/:bookingId/messages
router.use('/:bookingId/messages', messageRoutes);

module.exports = router;
