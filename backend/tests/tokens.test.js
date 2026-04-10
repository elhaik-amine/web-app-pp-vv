/**
 * Token tests — /api/tokens/*
 *
 * GET  /api/tokens/balance  — returns current balance
 * GET  /api/tokens/history  — returns transactions (PURCHASE | DEDUCTION | REWARD)
 * POST /api/tokens/buy      — PURCHASE: adds tokens, records transaction
 */

jest.mock('../src/config/db', () => ({
  pool: { execute: jest.fn() },
  connectDB: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/socket', () => ({
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
  initSocket: jest.fn(),
}));

const request  = require('supertest');
const app      = require('../src/app');
const { pool } = require('../src/config/db');
const { makeToken, mockUser } = require('./helpers');

const userToken = makeToken({ id: 1 });
const auth = () => pool.execute.mockResolvedValueOnce([[mockUser({ id: 1, token_balance: 3 })]]);

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Auth guard on token routes', () => {
  test('401 — GET /api/tokens/balance without token', async () => {
    const res = await request(app).get('/api/tokens/balance');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no token/i);
  });

  test('401 — POST /api/tokens/buy without token', async () => {
    const res = await request(app).post('/api/tokens/buy').send({ amount: 5 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/tokens/balance ──────────────────────────────────────────────────

describe('GET /api/tokens/balance', () => {
  test('200 — returns current token balance', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[{ token_balance: 3 }]]);

    const res = await request(app)
      .get('/api/tokens/balance')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('balance');
    expect(res.body.message).toBe('OK');
  });

  test('200 — balance of 0 is returned correctly', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[{ token_balance: 0 }]]);

    const res = await request(app)
      .get('/api/tokens/balance')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe(0);
  });
});

// ─── GET /api/tokens/history ─────────────────────────────────────────────────

describe('GET /api/tokens/history', () => {
  test('200 — returns all three transaction types', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[
      { id: 1, user_id: 1, type: 'PURCHASE',  amount: 5,   description: 'Token purchase',               created_at: new Date() },
      { id: 2, user_id: 1, type: 'DEDUCTION', amount: 1,   description: 'Service completion deduction', created_at: new Date() },
      { id: 3, user_id: 1, type: 'REWARD',    amount: 0.5, description: 'Review reward (4+ stars)',     created_at: new Date() },
    ]]);

    const res = await request(app)
      .get('/api/tokens/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);

    const types = res.body.data.map((t) => t.type);
    expect(types).toContain('PURCHASE');
    expect(types).toContain('DEDUCTION');
    expect(types).toContain('REWARD');
  });

  test('200 — returns empty array when no transactions', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/tokens/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── POST /api/tokens/buy ────────────────────────────────────────────────────

describe('POST /api/tokens/buy', () => {
  test('200 — buys tokens, returns new balance', async () => {
    auth();
    pool.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])    // UPDATE token_balance
      .mockResolvedValueOnce([{ insertId: 10 }])        // INSERT token_transaction PURCHASE
      .mockResolvedValueOnce([[{ token_balance: 8 }]]); // SELECT new balance

    const res = await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.new_balance).toBe(8);
    expect(res.body.message).toMatch(/purchased successfully/i);
  });

  test('200 — buying 1 token works (boundary value)', async () => {
    auth();
    pool.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([[{ token_balance: 4 }]]);

    const res = await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.new_balance).toBe(4);
  });

  test('400 — amount of 0 is rejected', async () => {
    auth();
    const res = await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/positive number/i);
  });

  test('400 — negative amount is rejected', async () => {
    auth();
    const res = await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: -3 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/positive number/i);
  });

  test('400 — missing amount field', async () => {
    auth();
    const res = await request(app)
      .post('/api/tokens/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
