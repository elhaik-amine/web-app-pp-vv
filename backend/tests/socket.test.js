/**
 * Socket.io event tests
 *
 * Verifies that the correct events are emitted as side-effects of HTTP actions.
 * getIO() is mocked so we can spy on to().emit() calls.
 *
 * Events emitted by the current API:
 *   notification:new  — created by createNotification() helper in bookingController
 *   booking:new       — emitted to provider when client creates a booking
 *   message:new       — emitted to booking room when a message is sent
 *   token:updated     — emitted to user when they purchase tokens
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
const { makeToken, mockUser, mockProvider, mockBooking } = require('./helpers');

const clientToken   = makeToken({ id: 1 });
const providerToken = makeToken({ id: 2 });

const authClient   = () => pool.execute.mockResolvedValueOnce([[mockUser({ id: 1 })]]);
const authProvider = () => pool.execute.mockResolvedValueOnce([[mockProvider({ id: 2 })]]);

// Reset DB mock queue AND socket spies before each test
beforeEach(() => {
  pool.execute.mockReset();
  mockEmit.mockClear();
  mockTo.mockClear();
});

// ─── booking:new + notification:new (booking created) ────────────────────────

describe('Events emitted when client creates a booking', () => {
  test('booking:new emitted to provider', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[{ id: 2, name: 'Ahmed' }]])   // provider exists
      .mockResolvedValueOnce([{ insertId: 1 }])               // INSERT booking
      .mockResolvedValueOnce([[mockBooking()]])                // SELECT booking
      .mockResolvedValueOnce([{ insertId: 1 }]);              // INSERT notification

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: 2, booking_date: '2026-06-01', time_slot: '08:00-12:00' });

    expect(mockTo).toHaveBeenCalledWith('user_2');
    expect(mockEmit).toHaveBeenCalledWith('booking:new', expect.objectContaining({ id: 1 }));
  });

  test('notification:new emitted to provider with type BOOKING_NEW', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[{ id: 2, name: 'Ahmed' }]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[mockBooking()]])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: 2, booking_date: '2026-06-01', time_slot: '08:00-12:00' });

    expect(mockEmit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ type: 'BOOKING_NEW' }),
    );
  });
});

// ─── notification:new (booking confirmed) ────────────────────────────────────

describe('Events emitted when provider confirms a booking', () => {
  test('notification:new emitted to client with type BOOKING_CONFIRMED', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', provider_id: 2, client_id: 1 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]); // notification

    await request(app)
      .patch('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(mockTo).toHaveBeenCalledWith('user_1');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ type: 'BOOKING_CONFIRMED' }),
    );
  });
});

// ─── notification:new (booking cancelled) ────────────────────────────────────

describe('Events emitted when booking is cancelled', () => {
  test('notification:new emitted to provider when client cancels', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', client_id: 1, provider_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]); // notification

    await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${clientToken}`);

    // notifyId = provider (2) when client (1) cancels
    expect(mockTo).toHaveBeenCalledWith('user_2');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ type: 'BOOKING_CANCELLED' }),
    );
  });

  test('notification:new emitted to client when provider cancels', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'CONFIRMED', client_id: 1, provider_id: 2 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    await request(app)
      .patch('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${providerToken}`);

    // notifyId = client (1) when provider (2) cancels
    expect(mockTo).toHaveBeenCalledWith('user_1');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ type: 'BOOKING_CANCELLED' }),
    );
  });
});

// ─── notification:new (booking completed) ────────────────────────────────────

describe('Events emitted when provider completes a booking', () => {
  test('notification:new emitted to client with type BOOKING_COMPLETED', async () => {
    authProvider();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'IN_PROGRESS', provider_id: 2, client_id: 1 })]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]); // notification

    await request(app)
      .patch('/api/bookings/1/complete')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(mockTo).toHaveBeenCalledWith('user_1');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ type: 'BOOKING_COMPLETED' }),
    );
  });
});

// ─── message:new ─────────────────────────────────────────────────────────────

describe('message:new emitted when message is sent', () => {
  const mockMsg = {
    id: 1, content: 'Hello', is_read: 0, created_at: new Date(),
    sender_id: 1, sender_name: 'Test Client', sender_avatar: null,
  };

  test('message:new emitted to booking room', async () => {
    authClient();
    pool.execute
      .mockResolvedValueOnce([[mockBooking({ status: 'PENDING', client_id: 1 })]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[mockMsg]]);

    await request(app)
      .post('/api/bookings/1/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hello' });

    expect(mockTo).toHaveBeenCalledWith('booking_1');
    expect(mockEmit).toHaveBeenCalledWith('message:new', expect.objectContaining({ content: 'Hello' }));
  });
});

// ─── token:updated ────────────────────────────────────────────────────────────

describe('token:updated emitted when tokens are purchased', () => {
  test('PURCHASE event emitted to the buying user', async () => {
    pool.execute
      .mockResolvedValueOnce([[mockUser({ id: 1 })]])  // auth
      .mockResolvedValueOnce([{ affectedRows: 1 }])    // UPDATE token_balance
      .mockResolvedValueOnce([{ insertId: 10 }])       // INSERT transaction
      .mockResolvedValueOnce([[{ token_balance: 8 }]]); // SELECT new balance

    await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ amount: 5 });

    expect(mockTo).toHaveBeenCalledWith('user_1');
    expect(mockEmit).toHaveBeenCalledWith(
      'token:updated',
      expect.objectContaining({ type: 'PURCHASE', amount: 5 }),
    );
  });
});
