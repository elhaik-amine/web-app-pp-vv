const NO_SHOW_RESPONSE_HOURS = 24;

const getTimeSlotStartHour = (timeSlot) => {
  switch (timeSlot) {
    case '12:00-15:00':
      return 12;
    case '15:00-18:00':
      return 15;
    case '18:00-21:00':
      return 18;
    case '08:00-12:00':
    default:
      return 8;
  }
};

const getBookingWindow = (booking) => {
  if (booking?.qr_active_from && booking?.qr_active_until) {
    return {
      start: new Date(booking.qr_active_from),
      end: new Date(booking.qr_active_until),
    };
  }

  const bookingDate = new Date(booking.date_meeting);
  const startHour = getTimeSlotStartHour(booking.time_slot);

  const start = new Date(bookingDate);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(bookingDate);
  end.setHours(startHour + 3, 0, 0, 0);

  return { start, end };
};

const syncNoShowDisputes = async (pool) => {
  const [expiredReports] = await pool.execute(
    `SELECT r.id, r.booking_id, r.reporter_id, r.reported_user_id
     FROM reports r
     WHERE r.type = 'NOSHOW'
       AND r.status = 'PENDING_REVIEW'
       AND r.response_deadline IS NOT NULL
       AND r.response_deadline <= NOW()`
  );

  for (const report of expiredReports) {
    const [counterReports] = await pool.execute(
      `SELECT id
       FROM reports
       WHERE booking_id = ?
         AND type = 'NOSHOW'
         AND reporter_id = ?
         AND reported_user_id = ?
       LIMIT 1`,
      [report.booking_id, report.reported_user_id, report.reporter_id]
    );

    if (counterReports.length > 0) {
      await pool.execute(
        `UPDATE reports
         SET status = 'UNDER_ADMIN_REVIEW',
             resolution_reason = 'Both parties reported a no-show for this booking',
             resolved_at = NULL
         WHERE booking_id = ?
           AND type = 'NOSHOW'
           AND id IN (?, ?)`,
        [report.booking_id, report.id, counterReports[0].id]
      );
      continue;
    }

    await pool.execute(
      `UPDATE reports
       SET status = 'AUTO_RESOLVED',
           resolution_reason = 'Auto-resolved because the other party did not respond before the deadline',
           resolved_at = NOW()
       WHERE id = ?`,
      [report.id]
    );

    await pool.execute(
      `UPDATE bookings
       SET status = 'CANCELLED'
       WHERE id = ?
         AND status = 'CONFIRMED'`,
      [report.booking_id]
    );
  }
};

module.exports = {
  NO_SHOW_RESPONSE_HOURS,
  getBookingWindow,
  syncNoShowDisputes,
};
