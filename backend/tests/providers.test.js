/**
 * Provider listing tests — /api/providers
 *
 * GET /api/providers       — list all active providers (with optional filters)
 * GET /api/providers/:id   — get a single provider's full profile
 *
 * The controller SELECTs:
 *   list   → u.id, u.name, u.avatar, pp.description, pp.city, pp.rating,
 *             pp.total_reviews, pp.is_verified, pp.category_id, sc.name AS category_name
 *   detail → adds u.phone
 * Response shape: { success: true, data: <row(s)> }  — no top-level message field.
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

const clientToken = makeToken({ id: 1 });
const auth = () => pool.execute.mockResolvedValueOnce([[mockUser({ id: 1 })]]);

// Row shape as returned by the provider listing query (LEFT JOIN service_categories)
const mockProviderRow = (overrides = {}) => ({
  id: 2,
  name: 'Ahmed',
  avatar: 'https://cdn.cloudinary.com/sample.jpg',
  description: 'Expert plumber',
  city: 'Casablanca',
  rating: 4.5,
  total_reviews: 12,
  is_verified: 1,
  category_id: 1,
  category_name: 'Plumbing',
  ...overrides,
});

// Detail row (adds u.phone)
const mockProviderDetailRow = (overrides = {}) => ({
  ...mockProviderRow(),
  phone: '0611111111',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

describe('Auth guard on provider routes', () => {
  test('401 — GET /api/providers without token', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/providers
// ---------------------------------------------------------------------------

describe('GET /api/providers', () => {
  test('200 — returns list of active providers with correct fields', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[
      mockProviderRow(),
      mockProviderRow({ id: 3, name: 'Sara', city: 'Rabat', rating: 3.8 }),
    ]]);

    const res = await request(app)
      .get('/api/providers')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const provider = res.body.data[0];
    expect(provider).toHaveProperty('description');
    expect(provider).toHaveProperty('city');
    expect(provider).toHaveProperty('rating');
    expect(provider).toHaveProperty('is_verified');
    expect(provider).toHaveProperty('category_name');
    // fields NOT present in the listing SELECT
    expect(provider).not.toHaveProperty('password');
    expect(provider).not.toHaveProperty('bio');
    expect(provider).not.toHaveProperty('years_experience');
    expect(provider).not.toHaveProperty('starting_price');
  });

  test('200 — returns empty array when no providers match', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/providers')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('200 — filter by city returns only matching providers', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[mockProviderRow({ city: 'Casablanca' })]]);

    const res = await request(app)
      .get('/api/providers?city=Casablanca')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.city === 'Casablanca')).toBe(true);
  });

  test('200 — filter by category_id returns only matching providers', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[
      mockProviderRow({ category_id: 2, category_name: 'Electrician' }),
    ]]);

    const res = await request(app)
      .get('/api/providers?category_id=2')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.category_id === 2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/providers/:id
// ---------------------------------------------------------------------------

describe('GET /api/providers/:id', () => {
  test('200 — returns full provider profile including phone', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[mockProviderDetailRow()]]);

    const res = await request(app)
      .get('/api/providers/2')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(2);
    expect(res.body.data).toHaveProperty('description');
    expect(res.body.data).toHaveProperty('phone');
    expect(res.body.data).toHaveProperty('category_name');
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('404 — provider not found returns error', async () => {
    auth();
    pool.execute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/providers/999')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/provider not found/i);
  });
});
