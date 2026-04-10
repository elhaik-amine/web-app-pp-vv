/**
 * Booking tests — /api/bookings/*
 *
 * Booking model: client books a provider for a date + time slot.
 * Slots: 08:00-12:00 | 12:00-15:00 | 15:00-18:00 | 18:00-21:00
 * Status flow: PENDING → CONFIRMED (provider) → COMPLETED (provider)
 *              PENDING or CONFIRMED → CANCELLED (client or provider)
 *
 * Routes:
 *   GET    /api/bookings/slots?provider_id=&date=  — getAvailableSlots
 *   POST   /api/bookings                           — createBooking (CLIENT)
 *   GET    /api/bookings                           — getBookings
 *   GET    /api/bookings/:id                       — getBookingById
 *   PATCH  /api/bookings/:id/confirm               — confirmBooking (PROVIDER)
 *   PATCH  /api/bookings/:id/cancel                — cancelBooking
 *   PATCH  /api/bookings/:id/complete              — completeBooking (PROVIDER)
 *   POST   /api/bookings/:id/review                — createReview (CLIENT)
 *   GET    /api/bookings/:bookingId/messages       — getMessages
 *   POST   /api/bookings/:bookingId/messages       — sendMessage
 *
 * Notes:
 *   - protect middleware always consumes the FIRST pool.execute call (SELECT user).
 *   - role() and restricted are in-memory checks — no DB calls.
 */

jest.mock('../src/config/db', () => ({
  pool: { execute: jest.fn() },
  connectDB: jest.fn().mockResolvedValue(),
}));

const mockEmit = jest.fn();
const mockTo   = jest.fn(() => ({ emit: mockEmit }));

jest.mock('../src/socket', () => ({
  getIO: jest.fn(() => ({ to: mockTo })),
  initSocket: jest.fn(),
}));

const request  = require('supertest');
const app      = require('../src/app');
const { pool } = require('../src/config/db');
const { makeToken, mockUser, mockProvider, mockBooking, mockBookingDetails } = require('./helpers');

const clientToken   = makeToken({ id: 1 });
const providerToken = makeToken({ id: 2 });
const otherToken    = makeToken({ id: 99 });

const authClient   = () => pool.execute.mockResolvedValueOnce([[mockUser({ id: 1 })]]);
const authProvider = () => pool.execute.mockResolvedValueOnce([[mockProvider({ id: 2 })]]);
const authOther    = () => pool.execute.mockResolvedValueOnce([[mockUser({ id: 99 })]]);

// Reset mock queue before every test to prevent unconsumed mocks from
// a failed test bleeding into the next one (clearMocks only clears call
// history, not the mockResolvedValueOnce queue).
beforeEach(() => { pool.execute.mockReset(); });

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Auth guard', () => {
  test('401 — GET /api/bookings without token', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no token/i);
  });

  test('401 — malformed token', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/bookings/slots ──────────────────────────────────────────────────

describe('GET /api/bookings/slots', () => {
  test('200 — returns available and taken slots for a provider on a date', async () => {
    authClient();
    // Two slots are taken (PENDING or CONFIRMED)
    pool.execute.mockResolvedValueOnce([[
      { time_slot: '08:00-12:00' },
      { time_slot: '12:00-15:00' },
    ]]);

    const res = await request(app)
      .get('/api/bookings/slots?provider_id=2&date=2026-06-01')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.taken).toContain('08:00-12:00');
    expect(res.body.data.available).not.toContain('08:00-12:00');
    expect(res.body.data.available).toHaveLength(2);
  });

  test('200 — all slots available when provider has no bookings', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]); // no taken slots

    const res = await request(app)
      .get('/api/bookings/slots?provider_id=2&date=2026-06-01')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.available).toHaveLength(4);
    expect(res.body.data.taken).toHaveLength(0);
  });

  test('400 — missing provider_id', async () => {
    authClient();
    const res = await request(app)
      .get('/api/bookings/slots?date=2026-06-01')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/provider_id and date are required/i);
  });

  test('400 — missing date', async () => {
    authClient();
    const res = await request(app)
      .get('/api/bookings/slots?provider_id=2')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/provider_id and date are required/i);
  });
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────

describe('POST /api/bookings', () => {
  const validBody = { provider_id: 2, booking_date: '2026-06-01', time_slot: '08:00-12:00' };

  test('201 — client creates booking successfully', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[{ id: 2, name: 'Ahmed' }]])  // provider exists
      .mockResolvedValueOnce([{ insertId: 1 }])              // INSERT booking
      .mockResolvedValueOnce([[mockBooking()]])               // SELECT booking
      .mockResolvedValueOnce([{ insertId: 1 }]);             // INSERT notification

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('PENDING');
  });

  test('400 — missing provider_id', async () => {
    authClient();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ booking_date: '2026-06-01', time_slot: '08:00-12:00' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('400 — invalid time_slot value', async () => {
    authClient();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ ...validBody, time_slot: '09:00-11:00' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid time slot/i);
  });

  test('403 — provider cannot create a booking (role check)', async () => {
    authProvider();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  test('404 — provider not found or inactive', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]); // provider not found
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/provider not found/i);
  });

  test('409 — time slot already booked (DB unique constraint)', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[{ id: 2, name: 'Ahmed' }]]) // provider found
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });    // duplicate entry

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });
});

// ─── GET /api/bookings ────────────────────────────────────────────────────────

describe('GET /api/bookings', () => {
  test('200 — client sees their own bookings', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBookingDetails({ client_id: 1 }),
      mockBookingDetails({ id: 2, client_id: 1, status: 'CONFIRMED' }),
    ]]);

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('client_name');
    expect(res.body.data[0]).toHaveProperty('provider_name');
  });

  test('200 — provider sees bookings assigned to them', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[
      mockBookingDetails({ provider_id: 2 }),
    ]]);

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('200 — filter by status', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[mockBookingDetails({ status: 'CONFIRMED' })]]);

    const res = await request(app)
      .get('/api/bookings?status=CONFIRMED')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((b) => b.status === 'CONFIRMED')).toBe(true);
  });

  test('200 — returns empty array when no bookings', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────

describe('GET /api/bookings/:id', () => {
  test('200 — client retrieves their own booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[mockBookingDetails({ client_id: 1 })]]);

    const res = await request(app)
      .get('/api/bookings/1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('booking_date');
    expect(res.body.data).toHaveProperty('time_slot');
  });

  test('200 — provider retrieves booking they own', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[mockBookingDetails({ provider_id: 2 })]]);

    const res = await request(app)
      .get('/api/bookings/1')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('404 — booking not found', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .get('/api/bookings/999')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('403 — unrelated user cannot view booking', async () => {
    authOther();
    // Booking belongs to client_id=1 and provider_id=2, not user 99
    pool.execute.mockResolvedValueOnce([[
      mockBookingDetails({ client_id: 1, provider_id: 2 }),
    ]]);

    const res = await request(app)
      .get('/api/bookings/1')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/access denied/i);
  });
});

// ─── PATCH /api/bookings/:id/confirm ─────────────────────────────────────────

describe('PATCH /api/bookings/:id/confirm', () => {
  test('200 — provider confirms a PENDING booking', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', provider_id: 2 })]])  // getBooking
      .mockResolvedValueOnce([{ affectedRows: 1 }])                                    // UPDATE (sets CONFIRMED + qr_code)
      .mockResolvedValueOnce([{ insertId: 1 }])                                        // INSERT notification
      .mockResolvedValueOnce([[mockBooking({ status: 'CONFIRMED', provider_id: 2, qr_code: 'abc' })]]);  // getBooking again

    const res = await request(app)
      .patch('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  test('403 — client cannot confirm a booking', async () => {
    authClient();
    const res = await request(app)
      .patch('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  test('403 — different provider cannot confirm another provider\'s booking', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[mockBooking({ status: 'PENDING', provider_id: 99 })]]);

    const res = await request(app)
      .patch('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the provider/i);
  });

  test('400 — cannot confirm a non-PENDING booking', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'CONFIRMED', provider_id: 2 }),
    ]]);

    const res = await request(app)
      .patch('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot confirm/i);
  });

  test('404 — booking not found', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[]]); // booking not found

    const res = await request(app)
      .patch('/api/bookings/999/confirm')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────

describe('PATCH /api/bookings/:id/cancel', () => {
  test('200 — client cancels their PENDING booking', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', client_id: 1, provider_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]); // notification

    const res = await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  test('200 — provider cancels a CONFIRMED booking', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'CONFIRMED', client_id: 1, provider_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 2 }]); // notification

    const res = await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — cannot cancel a COMPLETED booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'COMPLETED', client_id: 1, provider_id: 2 }),
    ]]);

    const res = await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot cancel/i);
  });

  test('400 — cannot cancel an already CANCELLED booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'CANCELLED', client_id: 1 }),
    ]]);
    const res = await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(400);
  });

  test('403 — unrelated user cannot cancel', async () => {
    authOther();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'PENDING', client_id: 1, provider_id: 2 }),
    ]]);
    const res = await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/access denied/i);
  });
});

// ─── PATCH /api/bookings/:id/complete ────────────────────────────────────────

describe('PATCH /api/bookings/:id/complete', () => {
  test('200 — provider marks IN_PROGRESS booking as complete', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'IN_PROGRESS', provider_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([{ insertId: 1 }]);      // notification

    const res = await request(app)
      .patch('/api/bookings/1/complete')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/completed/i);
  });

  test('403 — client cannot complete a booking', async () => {
    authClient();
    const res = await request(app)
      .patch('/api/bookings/1/complete')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  test('400 — cannot complete a CONFIRMED booking (must be IN_PROGRESS first)', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'CONFIRMED', provider_id: 2 }),
    ]]);

    const res = await request(app)
      .patch('/api/bookings/1/complete')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot complete/i);
  });

  test('403 — different provider cannot complete another provider\'s booking', async () => {
    authProvider();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'IN_PROGRESS', provider_id: 99 }),
    ]]);

    const res = await request(app)
      .patch('/api/bookings/1/complete')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the provider/i);
  });
});

// ─── POST /api/bookings/:id/review ───────────────────────────────────────────

describe('POST /api/bookings/:id/review', () => {
  test('201 — client leaves a review on a completed booking', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'COMPLETED', client_id: 1 })]])
      .mockResolvedValueOnce([{ insertId: 1 }])                         // INSERT review
      .mockResolvedValueOnce([[{ avg_rating: 4.5, total: 5 }]])          // SELECT AVG
      .mockResolvedValueOnce([{ affectedRows: 1 }]);                     // UPDATE provider_profiles

    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, comment: 'Excellent work!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/review submitted/i);
  });

  test('400 — rating must be between 1 and 5 (rating 0)', async () => {
    authClient();
    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rating must be between 1 and 5/i);
  });

  test('400 — rating above 5 is rejected', async () => {
    authClient();
    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  test('400 — cannot review a non-COMPLETED booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'CONFIRMED', client_id: 1 }),
    ]]);

    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/can only review completed/i);
  });

  test('403 — provider cannot leave a review', async () => {
    authProvider();
    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ rating: 5 });
    expect(res.status).toBe(403);
  });

  test('403 — wrong client cannot review another client\'s booking', async () => {
    authOther();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'COMPLETED', client_id: 1 }),
    ]]);
    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ rating: 4 });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only the client/i);
  });

  test('409 — cannot review the same booking twice', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'COMPLETED', client_id: 1 })]])
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

    const res = await request(app)
      .post('/api/bookings/1/review')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already reviewed/i);
  });
});

// ─── GET /api/bookings/:bookingId/messages ────────────────────────────────────

describe('GET /api/bookings/:bookingId/messages', () => {
  const mockMessage = (overrides = {}) => ({
    id: 1, content: 'Hello!', is_read: 0,
    created_at: new Date(), sender_id: 1,
    sender_name: 'Test Client', sender_avatar: null,
    ...overrides,
  });

  test('200 — returns messages for the booking', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ client_id: 1 })]]) // getBookingForUser
      .mockResolvedValueOnce([[mockMessage(), mockMessage({ id: 2, sender_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // mark as read

    const res = await request(app)
      .get('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('sender_name');
  });

  test('404 — booking not found or access denied', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]); // getBookingForUser returns null

    const res = await request(app)
      .get('/api/bookings/999/messages')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found or access denied/i);
  });
});

// ─── POST /api/bookings/:bookingId/messages ───────────────────────────────────

describe('POST /api/bookings/:bookingId/messages', () => {
  const mockMessage = (overrides = {}) => ({
    id: 1, content: 'Is the job still on?', is_read: 0,
    created_at: new Date(), sender_id: 1,
    sender_name: 'Test Client', sender_avatar: null,
    ...overrides,
  });

  test('201 — client sends a message on a PENDING booking', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', client_id: 1 })]]) // getBookingForUser
      .mockResolvedValueOnce([{ insertId: 1 }])         // INSERT message
      .mockResolvedValueOnce([[mockMessage()]]);          // SELECT message

    const res = await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Is the job still on?' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('content');
    expect(res.body.data).toHaveProperty('sender_name');
  });

  test('201 — provider sends a message on a CONFIRMED booking', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'CONFIRMED', provider_id: 2 })]])
      .mockResolvedValueOnce([{ insertId: 2 }])
      .mockResolvedValueOnce([[mockMessage({ id: 2, sender_id: 2, sender_name: 'Test Provider' })]]);

    const res = await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ content: 'I will be there at 8am.' });

    expect(res.status).toBe(201);
    expect(res.body.data.sender_id).toBe(2);
  });

  test('400 — empty content is rejected', async () => {
    authClient();
    const res = await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/content is required/i);
  });

  test('400 — cannot message on a CANCELLED booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'CANCELLED', client_id: 1 }),
    ]]);

    const res = await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cancelled or completed/i);
  });

  test('400 — cannot message on a COMPLETED booking', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[
      mockBooking({ status: 'COMPLETED', client_id: 1 }),
    ]]);
    const res = await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Thanks!' });
    expect(res.status).toBe(400);
  });

  test('404 — booking not found', async () => {
    authClient();
    pool.execute.mockResolvedValueOnce([[]]); // no booking found for this user

    const res = await request(app)
      .post('/api/bookings/999/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(404);
  });
});
