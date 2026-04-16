const crypto = require('crypto');
const { pool } = require('../config/db');
const { getIO } = require('../socket');

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_SLOTS = ['08:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const createNotification = async (userId, type, title, message, data = null) => {
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  const payload = {
    id: result.insertId,
    type,
    title,
    message,
    data: data || {},
  };
  try {
    getIO().to(`user_${userId}`).emit('notification:new', payload);
  } catch (_) {}
};

const getBooking = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
  return rows[0] || null;
};

// ─── GET /api/bookings/slots ───────────────────────────────────────────────
const getAvailableSlots = async (req, res) => {
  try {
    const { provider_id, date } = req.query;
    if (!provider_id || !date) {
      return res.status(400).json({ success: false, message: 'provider_id and date are required' });
    }

    const [takenRows] = await pool.execute(
      `SELECT time_slot FROM bookings WHERE provider_id = ? AND booking_date = ? AND status != 'CANCELLED'`,
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
const createBooking = async (req, res) => {
  try {
    const { provider_id, booking_date, time_slot, agreed_price, notes } = req.body;

    if (!provider_id || !booking_date || !time_slot) {
      return res.status(400).json({ success: false, message: 'provider_id, booking_date, and time_slot are required' });
    }

    if (!ALL_SLOTS.includes(time_slot)) {
      return res.status(400).json({ success: false, message: `Invalid time slot. Choose from: ${ALL_SLOTS.join(', ')}` });
    }

    const [providers] = await pool.execute(
      `SELECT u.id, u.name FROM users u JOIN provider_profiles pp ON pp.user_id = u.id WHERE u.id = ? AND u.status = 'ACTIVE' AND pp.is_active = 1`,
      [provider_id]
    );

    if (providers.length === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found or not available' });
    }

    // Save the booking with the price from Step 2
    const [result] = await pool.execute(
      `INSERT INTO bookings (client_id, provider_id, booking_date, time_slot, estimated_price, agreed_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, provider_id, booking_date, time_slot, agreed_price, agreed_price, notes || null]
    );

    const booking = await getBooking(result.insertId);
    
    const [clientRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const clientName = clientRows[0]?.name || 'Un client';

    await createNotification(
      provider_id,
      'BOOKING_NEW',
      'Nouvelle demande de réservation',
      `${clientName} a réservé vos services pour ${agreed_price} MAD le ${booking_date} (${time_slot})`,
      { booking_id: booking.id }
    );

    try { 
      const io = getIO();
      io.to(`user_${provider_id}`).emit('booking:new', { 
        ...booking, 
        client_name: clientName 
      });
      io.to(`user_${provider_id}`).emit('booking:updated', { message: 'New booking received' });
    } catch (_) {}

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
             c.name AS client_name, c.phone AS client_phone,
             p.name AS provider_name, p.phone AS provider_phone,
             sc.name AS category_name
      FROM bookings b
      JOIN users c ON c.id = b.client_id
      JOIN users p ON p.id = b.provider_id
      LEFT JOIN provider_profiles pp ON pp.user_id = b.provider_id
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
              c.name AS client_name, c.phone AS client_phone,
              p.name AS provider_name, p.phone AS provider_phone,
              sc.name AS category_name
       FROM bookings b
       JOIN users c ON c.id = b.client_id
       JOIN users p ON p.id = b.provider_id
       LEFT JOIN provider_profiles pp ON pp.user_id = b.provider_id
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

    // Generate QR code
    const crypto = require('crypto');
    const qrCode = crypto.randomBytes(32).toString('hex');
    
    // Set QR activation time based on booking date and time slot
    const bookingDate = new Date(booking.booking_date);
    const timeSlot = booking.time_slot;
    let startHour = 8;
    if (timeSlot === '12:00-15:00') startHour = 12;
    else if (timeSlot === '15:00-18:00') startHour = 15;
    else if (timeSlot === '18:00-21:00') startHour = 18;
    
    const qrActiveFrom = new Date(bookingDate);
    qrActiveFrom.setHours(startHour, 0, 0, 0);
    
    const qrActiveUntil = new Date(bookingDate);
    qrActiveUntil.setHours(startHour + 3, 0, 0, 0);

    await pool.execute(
      "UPDATE bookings SET status = 'CONFIRMED', qr_code = ?, qr_active_from = ?, qr_active_until = ? WHERE id = ?",
      [qrCode, qrActiveFrom, qrActiveUntil, booking.id]
    );

    await createNotification(
      booking.client_id,
      'BOOKING_CONFIRMED',
      'Booking Confirmed',
      `Your booking on ${booking.booking_date} (${booking.time_slot}) is confirmed. QR code will be active from ${qrActiveFrom.toLocaleTimeString()}.`,
      { booking_id: booking.id }
    );

    const updated = await getBooking(booking.id);
    try { 
      getIO().to(`user_${booking.client_id}`).emit('booking:confirmed', updated);
      getIO().to(`user_${booking.provider_id}`).emit('booking:confirmed', updated);
    } catch (_) {}

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ─── POST /api/bookings/:id/accept-price ─────────────────────────────────────
const acceptPrice = async (req, res) => {
  try {
    const { price } = req.body;
    const bookingId = req.params.id;

    if (!price || price <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price required' });
    }

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [existing] = await pool.execute(
      'SELECT * FROM price_acceptances WHERE booking_id = ? AND user_id = ?',
      [bookingId, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà accepté ce prix' });
    }

    await pool.execute(
      'INSERT INTO price_acceptances (booking_id, user_id, price) VALUES (?, ?, ?)',
      [bookingId, req.user.id, price]
    );

    const [acceptances] = await pool.execute(
      'SELECT * FROM price_acceptances WHERE booking_id = ?',
      [bookingId]
    );

    const bothAccepted = acceptances.length === 2;
    const otherUserId = booking.client_id === req.user.id ? booking.provider_id : booking.client_id;

    if (bothAccepted) {
      await pool.execute(
        "UPDATE bookings SET status = 'CONFIRMED', agreed_price = ?, estimated_price = ? WHERE id = ?",
        [price, price, bookingId]
      );
      
      await pool.execute('DELETE FROM price_acceptances WHERE booking_id = ?', [bookingId]);

      await createNotification(
        otherUserId,
        'PRICE_ACCEPTED_BOTH',
        'Réservation confirmée',
        `Le prix de ${price} MAD a été accepté par les deux parties. La réservation est confirmée !`,
        { booking_id: bookingId, agreed_price: price }
      );

      const io = getIO();
      io.to(`booking_${bookingId}`).emit('booking:confirmed', { booking_id: bookingId, agreed_price: price, status: 'CONFIRMED' });
      io.to(`user_${booking.client_id}`).emit('booking:updated', { booking_id: bookingId, status: 'CONFIRMED', agreed_price: price });
      io.to(`user_${booking.provider_id}`).emit('booking:updated', { booking_id: bookingId, status: 'CONFIRMED', agreed_price: price });

      res.json({ success: true, message: 'Prix accepté par les deux parties. Réservation confirmée !', data: { bothAccepted: true, status: 'CONFIRMED', price: price } });
    } else {
      await pool.execute('UPDATE bookings SET estimated_price = ?, agreed_price = ? WHERE id = ?', 
        [price, price, bookingId]);

      await createNotification(
        otherUserId,
        'PRICE_ACCEPTED',
        'Acceptation du prix',
        `${req.user.name} a accepté le prix de ${price} MAD. Acceptez-vous également ?`,
        { booking_id: bookingId, price: price }
      );

      const io = getIO();
      io.to(`user_${otherUserId}`).emit('notification:new', {
        type: 'PRICE_ACCEPTED',
        title: 'Acceptation du prix',
        message: `${req.user.name} a accepté le prix de ${price} MAD. Acceptez-vous également ?`,
        data: { booking_id: bookingId, price: price }
      });
      io.to(`booking_${bookingId}`).emit('booking:price_updated', { booking_id: bookingId, estimated_price: price });

      res.json({ success: true, message: 'Prix accepté. En attente de l\'acceptation de l\'autre partie.', data: { bothAccepted: false, price: price } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/reject-price ─────────────────────────────────────
const rejectPrice = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await pool.execute('DELETE FROM price_acceptances WHERE booking_id = ?', [bookingId]);

    const otherUserId = booking.client_id === req.user.id ? booking.provider_id : booking.client_id;

    await createNotification(
      otherUserId,
      'PRICE_REJECTED',
      'Prix refusé',
      `${req.user.name} a refusé le prix proposé. La négociation continue.`,
      { booking_id: bookingId }
    );

    const io = getIO();
    io.to(`user_${otherUserId}`).emit('notification:new', {
      type: 'PRICE_REJECTED',
      title: 'Prix refusé',
      message: `${req.user.name} a refusé le prix. Continuez la négociation.`,
      data: { booking_id: bookingId }
    });

    res.json({ success: true, message: 'Prix refusé. La négociation continue.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/set-price ───────────────────────────────────────
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

    await pool.execute('UPDATE bookings SET agreed_price = ?, estimated_price = ? WHERE id = ?', 
      [agreed_price, agreed_price, booking.id]);

    const notifyId = req.user.id === booking.client_id ? booking.provider_id : booking.client_id;
    await createNotification(
      notifyId,
      'PRICE_AGREED',
      'Prix accepté',
      `${req.user.name} a accepté le prix de ${agreed_price} MAD`,
      { booking_id: booking.id, agreed_price }
    );

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('booking:price_set', { booking_id: booking.id, agreed_price });
    io.to(`user_${notifyId}`).emit('notification:new', {
      type: 'PRICE_AGREED',
      title: 'Prix accepté',
      message: `${req.user.name} a accepté le prix de ${agreed_price} MAD`,
      data: { booking_id: booking.id }
    });

    res.json({ success: true, message: 'Agreed price saved', data: { agreed_price } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/reject ───────────────────────────────────────────
const rejectBookingOffer = async (req, res) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const notifyId = req.user.id === booking.client_id ? booking.provider_id : booking.client_id;
    await createNotification(
      notifyId,
      'OFFER_REJECTED',
      'Offre refusée',
      `${req.user.name} a refusé l'offre`,
      { booking_id: booking.id }
    );

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('negotiation:rejected', { booking_id: booking.id, rejected_by: req.user.id });

    res.json({ success: true, message: 'Offer rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/scan-qr ──────────────────────────────────────────
// ─── POST /api/bookings/:id/scan-qr ──────────────────────────────────────────

const scanQR = async (req, res) => {
  try {
    const { qr_code } = req.body;
    const bookingId = req.params.id;

    if (!qr_code) {
      return res.status(400).json({ success: false, message: 'qr_code is required' });
    }

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Check if user is provider
    if (booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the provider can scan the QR code' });
    }
    
    // Check if booking is confirmed
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: `Cannot scan QR on a booking with status: ${booking.status}` });
    }
    
    // Check if QR code matches
    if (booking.qr_code !== qr_code) {
      return res.status(400).json({ success: false, message: 'Invalid QR code' });
    }
    
    // Check if QR is active (time-based)
    const now = new Date();
    const qrActiveFrom = new Date(booking.qr_active_from);
    const qrActiveUntil = new Date(booking.qr_active_until);
    
    if (now < qrActiveFrom) {
      return res.status(400).json({ 
        success: false, 
        message: `QR code actif à partir de ${qrActiveFrom.toLocaleTimeString()}` 
      });
    }
    
    if (now > qrActiveUntil) {
      return res.status(400).json({ 
        success: false, 
        message: 'QR code expiré' 
      });
    }

    // Update status to IN_PROGRESS
    await pool.execute("UPDATE bookings SET status = 'IN_PROGRESS' WHERE id = ?", [booking.id]);

    await createNotification(
      booking.client_id,
      'BOOKING_STARTED',
      'Service Started',
      `${req.user.name} a démarré le service`,
      { booking_id: booking.id }
    );

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('booking:started', { booking_id: booking.id });
    io.to(`user_${booking.client_id}`).emit('notification:new', {
      type: 'BOOKING_STARTED',
      title: 'Service démarré',
      message: `Le prestataire a démarré votre service`,
      data: { booking_id: booking.id }
    });

    res.json({ success: true, message: 'QR scanned — service is now in progress' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ─── PATCH /api/bookings/:id/complete ────────────────────────────────────────
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

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('booking:completed', { booking_id: booking.id });

    res.json({ success: true, message: 'Booking completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
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

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('booking:cancelled', { booking_id: booking.id });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/review ───────────────────────────────────────────
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
  acceptPrice,
  rejectPrice,
  setAgreedPrice,
  rejectBookingOffer,
  scanQR,
  cancelBooking,
  completeBooking,
  createReview,
};