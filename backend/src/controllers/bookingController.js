const crypto = require('crypto');
const { pool } = require('../config/db');
const { getIO } = require('../socket');
const {
  NO_SHOW_RESPONSE_HOURS,
  getBookingWindow,
  syncNoShowDisputes,
} = require('../utils/noShowDisputes');

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_SLOTS = ['08:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];
const TOKEN_COST_PER_BOOKING = 1;

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

    const dateParts = String(date).split('-').map(Number);
    if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) {
      return res.status(400).json({ success: false, message: 'date must be YYYY-MM-DD' });
    }

    const meetingDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const jsDay = meetingDate.getDay(); // 0=Sun ... 6=Sat
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

    const [availabilityRows] = await pool.execute(
      `SELECT is_available
       FROM provider_availability
       WHERE provider_id = ? AND day_of_week = ?`,
      [provider_id, dayOfWeek]
    );

    if (availabilityRows.length > 0 && Number(availabilityRows[0].is_available) !== 1) {
      return res.json({
        success: true,
        data: {
          date,
          available: [],
          taken: ALL_SLOTS,
          provider_available: false,
        },
      });
    }

    const [takenRows] = await pool.execute(
      `SELECT time_slot FROM bookings WHERE provider_id = ? AND date_meeting = ? AND status != 'CANCELLED'`,
      [provider_id, date]
    );

    const takenSlots = takenRows.map((r) => r.time_slot);
    const availableSlots = ALL_SLOTS.filter((slot) => !takenSlots.includes(slot));

    res.json({
      success: true,
      data: { date, available: availableSlots, taken: takenSlots, provider_available: true },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings ───────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { provider_id, date_meeting, time_slot, estimated_price, notes } = req.body;

    if (!provider_id || !date_meeting || !time_slot) {
      return res.status(400).json({ success: false, message: 'provider_id, date_meeting, and time_slot are required' });
    }

    if (!ALL_SLOTS.includes(time_slot)) {
      return res.status(400).json({ success: false, message: `Invalid time slot. Choose from: ${ALL_SLOTS.join(', ')}` });
    }

    const [providers] = await pool.execute(
      `SELECT u.id, u.name, u.token_balance FROM users u JOIN provider_profiles pp ON pp.user_id = u.id WHERE u.id = ? AND u.status = 'ACTIVE' AND pp.is_active = 1`,
      [provider_id]
    );

    if (providers.length === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found or not available' });
    }

    // Token balance check removed so clients can still request, and providers are reminded to buy tokens when accepting

    // Save the booking
    const [result] = await pool.execute(
      `INSERT INTO bookings (client_id, provider_id, date_meeting, time_slot, estimated_price, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, provider_id, date_meeting, time_slot, estimated_price || null, notes || null]
    );

    const booking = await getBooking(result.insertId);
    
    const [clientRows] = await pool.execute('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const clientName = clientRows[0]?.name || 'Un client';

    await createNotification(
      provider_id,
      'BOOKING_NEW',
      'Nouvelle demande de réservation',
      `${clientName} a réservé vos services pour le ${date_meeting} (${time_slot})`,
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
             c.name AS client_name, c.phone AS client_phone, c.avatar AS client_avatar,
             p.name AS provider_name, p.phone AS provider_phone, p.avatar AS provider_avatar,
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

    sql += ' ORDER BY b.date_meeting DESC, b.time_slot ASC';

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
              c.name AS client_name, c.phone AS client_phone, c.avatar AS client_avatar,
              p.name AS provider_name, p.phone AS provider_phone, p.avatar AS provider_avatar,
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

    // Check provider token balance
    const [providerRows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [booking.provider_id]);
    if (Number(providerRows[0].token_balance) < TOKEN_COST_PER_BOOKING) {
      return res.status(400).json({ success: false, message: 'Solde de tokens insuffisant pour confirmer cette réservation' });
    }

    // Generate QR code
    const crypto = require('crypto');
    const qrCode = crypto.randomBytes(32).toString('hex');
    
    // Set QR activation time based on booking date and time slot
    const bookingDate = new Date(booking.date_meeting);
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

    // Deduct token from provider
    await pool.execute('UPDATE users SET token_balance = token_balance - ? WHERE id = ?', [TOKEN_COST_PER_BOOKING, booking.provider_id]);
    await pool.execute(
      'INSERT INTO token_transactions (user_id, type, amount, description, booking_id) VALUES (?, ?, ?, ?, ?)',
      [booking.provider_id, 'DEDUCTION', -TOKEN_COST_PER_BOOKING, 'Réservation confirmée', booking.id]
    );

    await createNotification(
      booking.client_id,
      'BOOKING_CONFIRMED',
      'Booking Confirmed',
      `Votre réservation du ${booking.date_meeting} (${booking.time_slot}) est confirmée. Le QR code sera actif à partir de ${qrActiveFrom.toLocaleTimeString()}.`,
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

    if (req.user.id === booking.provider_id) {
      const [providerRows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [booking.provider_id]);
      if (Number(providerRows[0].token_balance) < TOKEN_COST_PER_BOOKING) {
        return res.status(400).json({ success: false, message: "Vous n'avez pas assez de tokens pour accepter un prix." });
      }
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
      // Check provider token balance
      const [providerRows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [booking.provider_id]);
      if (Number(providerRows[0].token_balance) < TOKEN_COST_PER_BOOKING) {
        return res.status(400).json({ success: false, message: 'Le prestataire n\'a pas assez de tokens pour finaliser cette réservation' });
      }

      // Generate QR code upon confirmation
      const crypto = require('crypto');
      const qrCode = crypto.randomBytes(32).toString('hex');
      
      const bookingDate = new Date(booking.date_meeting);
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
        "UPDATE bookings SET status = 'CONFIRMED', agreed_price = ?, estimated_price = ?, qr_code = ?, qr_active_from = ?, qr_active_until = ? WHERE id = ?",
        [price, price, qrCode, qrActiveFrom, qrActiveUntil, bookingId]
      );
      
      // Deduct token from provider
      await pool.execute('UPDATE users SET token_balance = token_balance - ? WHERE id = ?', [TOKEN_COST_PER_BOOKING, booking.provider_id]);
      await pool.execute(
        'INSERT INTO token_transactions (user_id, type, amount, description, booking_id) VALUES (?, ?, ?, ?, ?)',
        [booking.provider_id, 'DEDUCTION', -TOKEN_COST_PER_BOOKING, 'Réservation confirmée après négociation', bookingId]
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
      `Votre réservation du ${booking.date_meeting} (${booking.time_slot}) est terminée. Laissez un avis !`,
      { booking_id: booking.id }
    );

    const io = getIO();
    io.to(`booking_${booking.id}`).emit('booking:completed', { booking_id: booking.id });

    res.json({ success: true, message: 'Booking completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/bookings/:id/photos ─────────────────────────────────────────────
const getBookingPhotos = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (
      booking.client_id !== req.user.id &&
      booking.provider_id !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [rows] = await pool.execute(
      `SELECT *
       FROM booking_photos
       WHERE booking_id = ?
         AND (
           (type = 'BEFORE' AND uploaded_by = ?)
           OR (type = 'AFTER' AND uploaded_by = ?)
         )
       ORDER BY type, sort_order`,
      [bookingId, booking.client_id, booking.provider_id]
    );

    const beforePhotos = rows
      .filter((p) => p.type === 'BEFORE' && Number(p.uploaded_by) === Number(booking.client_id))
      .map((p) => p.url);
    const afterPhotos = rows
      .filter((p) => p.type === 'AFTER' && Number(p.uploaded_by) === Number(booking.provider_id))
      .map((p) => p.url);

    return res.json({
      success: true,
      data: { before: beforePhotos, after: afterPhotos },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/after-images ─────────────────────────────────────
const uploadAfterImages = async (req, res) => {
  try {
    const { images } = req.body;
    const bookingId = req.params.id;

    console.log('Received images:', images);
    console.log('Images count:', images?.length);

    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    if (images.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 after images allowed' });
    }

    const invalidImage = images.find((image) => typeof image !== 'string' || !/^https?:\/\//i.test(image));
    if (invalidImage) {
      return res.status(400).json({
        success: false,
        message: 'After images must be uploaded first and sent as public URLs',
      });
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the provider can upload after images' });
    }

    if (booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: `Cannot upload after images for status: ${booking.status}` });
    }

    await pool.execute(
      "DELETE FROM booking_photos WHERE booking_id = ? AND type = 'AFTER'",
      [bookingId]
    );

    for (let i = 0; i < images.length; i += 1) {
      await pool.execute(
        'INSERT INTO booking_photos (booking_id, uploaded_by, type, url, sort_order) VALUES (?, ?, ?, ?, ?)',
        [bookingId, req.user.id, 'AFTER', images[i], i + 1]
      );
    }

    await pool.execute("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?", [bookingId]);

    await createNotification(
      booking.client_id,
      'BOOKING_COMPLETED',
      'Service Completed',
      'Votre service est terminé. Laissez un avis !',
      { booking_id: booking.id }
    );

    try {
      const io = getIO();
      io.to(`booking_${booking.id}`).emit('booking:completed', { booking_id: booking.id });
      io.to(`user_${booking.client_id}`).emit('booking:completed', { booking_id: booking.id });
    } catch (_) {}

    res.json({ success: true, message: 'Images uploaded and service completed' });
  } catch (error) {
    console.error('Upload error:', error);
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

    const wasConfirmed = booking.status === 'CONFIRMED';

    await pool.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [booking.id]);

    if (wasConfirmed) {
      // Refund token
      await pool.execute('UPDATE users SET token_balance = token_balance + ? WHERE id = ?', [TOKEN_COST_PER_BOOKING, booking.provider_id]);
      await pool.execute(
        'INSERT INTO token_transactions (user_id, type, amount, description, booking_id) VALUES (?, ?, ?, ?, ?)',
        [booking.provider_id, 'REWARD', TOKEN_COST_PER_BOOKING, 'Réservation annulée (remboursement)', booking.id]
      );
    }

    const notifyId = req.user.id === booking.client_id ? booking.provider_id : booking.client_id;
    await createNotification(
      notifyId,
      'BOOKING_CANCELLED',
      'Booking Cancelled',
      `La réservation du ${booking.date_meeting} (${booking.time_slot}) a été annulée`,
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

    const safeComment = (comment || '').trim();
    const shortComment = safeComment ? safeComment.substring(0, 50) : 'Sans commentaire';
    await createNotification(
      booking.provider_id,
      'REVIEW',
      'Nouvel avis',
      `${req.user.name} vous a noté ${rating}/5 : "${shortComment}"`,
      { booking_id: booking.id, rating, comment: safeComment || null }
    );

    if (rating >= 4) {
      await pool.execute(
        'UPDATE users SET token_balance = token_balance + 0.5 WHERE id = ?',
        [booking.provider_id]
      );

      await pool.execute(
        'INSERT INTO token_transactions (user_id, type, amount, description, booking_id) VALUES (?, ?, ?, ?, ?)',
        [booking.provider_id, 'REWARD', 0.5, `Avis ${rating} étoiles`, booking.id]
      );

      await createNotification(
        booking.provider_id,
        'TOKEN_REWARD',
        'Token reçu 🪙',
        `Vous avez reçu +0.5 token pour votre avis ${rating} étoiles !`,
        { booking_id: booking.id, amount: 0.5 }
      );
    }

    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'You already reviewed this booking' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/bookings/:id/report-noshow ────────────────────────────────────
const reportNoShow = async (req, res) => {
  try {
    await syncNoShowDisputes(pool);

    const {
      description,
      evidence_photo_url,
      evidence_latitude,
      evidence_longitude,
      evidence_captured_at,
    } = req.body;
    const bookingId = req.params.id;

    const booking = await getBooking(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only the client or the provider of this booking can report a no-show
    if (booking.client_id !== req.user.id && booking.provider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only makes sense on a CONFIRMED booking
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Cannot report no-show for a booking with status: ${booking.status}`,
      });
    }

    const { end: meetingWindowEnd } = getBookingWindow(booking);
    if (new Date() <= meetingWindowEnd) {
      return res.status(400).json({
        success: false,
        message: 'A no-show can only be reported after the booking time window has ended',
      });
    }

    if (!description || String(description).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a short description with at least 10 characters',
      });
    }

    // Prevent duplicate report from the same user for the same booking
    const [existing] = await pool.execute(
      "SELECT id FROM reports WHERE booking_id = ? AND reporter_id = ? AND type = 'NOSHOW'",
      [bookingId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You already reported a no-show for this booking' });
    }

    // The reported user is the other party
    const reportedUserId = req.user.id === booking.client_id
      ? booking.provider_id
      : booking.client_id;

    const [counterReports] = await pool.execute(
      `SELECT id
       FROM reports
       WHERE booking_id = ?
         AND reporter_id = ?
         AND reported_user_id = ?
         AND type = 'NOSHOW'
       LIMIT 1`,
      [bookingId, reportedUserId, req.user.id]
    );

    const status = counterReports.length > 0 ? 'UNDER_ADMIN_REVIEW' : 'PENDING_REVIEW';
    const responseDeadline = counterReports.length > 0
      ? null
      : new Date(Date.now() + (NO_SHOW_RESPONSE_HOURS * 60 * 60 * 1000));

    await pool.execute(
      `INSERT INTO reports (
         reporter_id, reported_user_id, booking_id, type, description, status,
         evidence_photo_url, evidence_latitude, evidence_longitude, evidence_captured_at,
         response_deadline
       ) VALUES (?, ?, ?, 'NOSHOW', ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        reportedUserId,
        bookingId,
        String(description).trim(),
        status,
        evidence_photo_url || null,
        evidence_latitude || null,
        evidence_longitude || null,
        evidence_captured_at || new Date(),
        responseDeadline,
      ]
    );

    if (counterReports.length > 0) {
      await pool.execute(
        `UPDATE reports
         SET status = 'UNDER_ADMIN_REVIEW',
             response_deadline = NULL,
             resolution_reason = 'Both parties reported a no-show for this booking'
         WHERE id = ?`,
        [counterReports[0].id]
      );

      await createNotification(
        reportedUserId,
        'NOSHOW_DISPUTE_ESCALATED',
        'Litige d\'absence en revue',
        `Les deux parties ont signalé une absence pour la réservation #${bookingId}. Un administrateur devra trancher.`,
        { booking_id: bookingId, report_status: 'UNDER_ADMIN_REVIEW' }
      );

      await createNotification(
        req.user.id,
        'NOSHOW_DISPUTE_ESCALATED',
        'Litige d\'absence en revue',
        `Votre contre-signalement pour la réservation #${bookingId} a été envoyé à l'administration.`,
        { booking_id: bookingId, report_status: 'UNDER_ADMIN_REVIEW' }
      );

      return res.status(201).json({
        success: true,
        message: 'The no-show dispute has been escalated to admin review',
        data: { booking_id: Number(bookingId), status: 'UNDER_ADMIN_REVIEW' },
      });
    }

    await createNotification(
      reportedUserId,
      'NOSHOW_REPORTED',
      'Absence signalée',
      `${req.user.name} a signalé votre absence pour la réservation #${bookingId}. Répondez avant ${responseDeadline.toLocaleString()}.`,
      { booking_id: bookingId, report_status: 'PENDING_REVIEW', response_deadline: responseDeadline }
    );

    res.status(201).json({
      success: true,
      message: 'No-show report submitted. The other party has 24 hours to respond.',
      data: {
        booking_id: Number(bookingId),
        status: 'PENDING_REVIEW',
        response_deadline: responseDeadline,
      },
    });
  } catch (error) {
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
  getBookingPhotos,
  uploadAfterImages,
  createReview,
  reportNoShow,
};
