/**
 * Auth tests
 *
 * POST /api/auth/client/register
 * POST /api/auth/client/login
 * POST /api/auth/provider/register
 * POST /api/auth/provider/login
 * POST /api/auth/logout
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 */

jest.mock('../src/config/db', () => ({
  pool: { execute: jest.fn() },
  connectDB: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/socket', () => ({
  getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
  initSocket: jest.fn(),
}));

jest.mock('../src/utils/sendEmail', () => jest.fn().mockResolvedValue());

const request   = require('supertest');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const app       = require('../src/app');
const { pool }  = require('../src/config/db');
const sendEmail = require('../src/utils/sendEmail');

let hashedPassword;
beforeAll(async () => { hashedPassword = await bcrypt.hash('password123', 10); });

// Reset pool.execute between every test so leftover mockResolvedValueOnce
// values from one test never bleed into the next.
beforeEach(() => {
  pool.execute.mockReset();
  sendEmail.mockReset();
  sendEmail.mockResolvedValue(); // keep sendEmail as a no-op resolved promise
});

// ---------------------------------------------------------------------------
// CLIENT register
// ---------------------------------------------------------------------------

describe('POST /api/auth/client/register', () => {
  test('201 — registers client and returns accessToken (no refreshToken)', async () => {
    pool.execute
      .mockResolvedValueOnce([[]])               // no duplicate email
      .mockResolvedValueOnce([{ insertId: 1 }])  // INSERT user
      .mockResolvedValueOnce([[{
        id: 1, name: 'Ali', email: 'ali@test.com', role: 'CLIENT',
        status: 'ACTIVE', token_balance: 0, avatar: null,
      }]]);

    const res = await request(app).post('/api/auth/client/register').send({
      name: 'Ali', email: 'ali@test.com', password: 'password123', phone: '0600000000',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).not.toHaveProperty('refreshToken');
    expect(res.body.data.user.role).toBe('CLIENT');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('400 — missing name/email/password', async () => {
    const res = await request(app).post('/api/auth/client/register').send({ email: 'x@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — duplicate email', async () => {
    pool.execute.mockResolvedValueOnce([[{ id: 5 }]]);
    const res = await request(app).post('/api/auth/client/register').send({
      name: 'Bob', email: 'existing@test.com', password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already in use/i);
  });
});

// ---------------------------------------------------------------------------
// CLIENT login
// ---------------------------------------------------------------------------

describe('POST /api/auth/client/login', () => {
  test('200 — valid credentials return accessToken', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 1, name: 'Ali', email: 'ali@test.com', password: hashedPassword,
      role: 'CLIENT', status: 'ACTIVE', token_balance: 0,
      reset_token: null, reset_token_expires: null,
    }]]);

    const res = await request(app).post('/api/auth/client/login').send({
      email: 'ali@test.com', password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('400 — wrong password', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 1, email: 'ali@test.com', password: hashedPassword, role: 'CLIENT', status: 'ACTIVE',
    }]]);
    const res = await request(app).post('/api/auth/client/login').send({
      email: 'ali@test.com', password: 'wrongpass',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('400 — provider trying to login via client route is rejected', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // WHERE role='CLIENT' finds nothing
    const res = await request(app).post('/api/auth/client/login').send({
      email: 'provider@test.com', password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('403 — suspended client cannot login', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 1, email: 'ali@test.com', password: hashedPassword, role: 'CLIENT', status: 'SUSPENDED',
    }]]);
    const res = await request(app).post('/api/auth/client/login').send({
      email: 'ali@test.com', password: 'password123',
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});

// ---------------------------------------------------------------------------
// PROVIDER register
// ---------------------------------------------------------------------------

describe('POST /api/auth/provider/register', () => {
  const validProvider = {
    name: 'Ahmed', email: 'ahmed@test.com', password: 'password123',
    phone: '0611111111', avatar: 'https://cdn.cloudinary.com/sample.jpg',
    description: 'Expert plumber with 5 years experience',
    city: 'Casablanca',
  };

  test('201 — registers provider, creates profile row, returns full profile', async () => {
    pool.execute
      .mockResolvedValueOnce([[]])               // no duplicate email
      .mockResolvedValueOnce([{ insertId: 2 }])  // INSERT user
      .mockResolvedValueOnce([{ insertId: 1 }])  // INSERT provider_profiles
      .mockResolvedValueOnce([[{
        id: 2, name: 'Ahmed', email: 'ahmed@test.com', role: 'PROVIDER',
        avatar: validProvider.avatar, status: 'ACTIVE', token_balance: 0,
        description: validProvider.description, city: validProvider.city,
        rating: 0, is_verified: 0,
      }]]);

    const res = await request(app).post('/api/auth/provider/register').send(validProvider);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('PROVIDER');
    expect(res.body.data.user).toHaveProperty('description');
    expect(res.body.data.user).toHaveProperty('city');
    expect(res.body.data).toHaveProperty('accessToken');
  });

  test('400 — missing avatar', async () => {
    const { avatar, ...noAvatar } = validProvider;
    const res = await request(app).post('/api/auth/provider/register').send(noAvatar);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/avatar/i);
  });

  test('400 — missing description', async () => {
    const { description, ...noDesc } = validProvider;
    const res = await request(app).post('/api/auth/provider/register').send(noDesc);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/description/i);
  });

  test('400 — missing city', async () => {
    const { city, ...noCity } = validProvider;
    const res = await request(app).post('/api/auth/provider/register').send(noCity);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/city/i);
  });

  test('400 — duplicate email', async () => {
    pool.execute.mockResolvedValueOnce([[{ id: 9 }]]); // duplicate
    const res = await request(app).post('/api/auth/provider/register').send(validProvider);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already in use/i);
  });
});

// ---------------------------------------------------------------------------
// PROVIDER login
// ---------------------------------------------------------------------------

describe('POST /api/auth/provider/login', () => {
  test('200 — valid credentials return accessToken with profile fields', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 2, name: 'Ahmed', email: 'ahmed@test.com', password: hashedPassword,
      role: 'PROVIDER', status: 'ACTIVE', token_balance: 3,
      reset_token: null, reset_token_expires: null,
      description: 'Expert plumber', city: 'Casablanca',
      rating: 4.5, is_verified: 1,
    }]]);

    const res = await request(app).post('/api/auth/provider/login').send({
      email: 'ahmed@test.com', password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toHaveProperty('description');
    expect(res.body.data.user).toHaveProperty('city');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('400 — client trying to login via provider route is rejected', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // WHERE role='PROVIDER' finds nothing
    const res = await request(app).post('/api/auth/provider/login').send({
      email: 'client@test.com', password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});

// ---------------------------------------------------------------------------
// Shared: logout, forgot-password, reset-password
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  test('200 — always succeeds (stateless)', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/forgot-password', () => {

  test('400 — missing email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email is required/i);
  });

  test('200 — unknown email returns generic message, no email sent', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no user
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email exists/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('200 — known email sends reset link email', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ id: 3, name: 'Ali' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ali@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull(); // token NOT in response
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ali@test.com',
      html: expect.stringContaining('/reset-password?token='),
    }));
  });
});

describe('POST /api/auth/reset-password', () => {
  test('400 — missing token or password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/token and new password are required/i);
  });

  test('400 — non-JWT token is rejected', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'not-a-jwt', password: 'newpass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  test('400 — expired JWT is rejected', async () => {
    const expired = jwt.sign({ email: 'ali@test.com' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const res = await request(app).post('/api/auth/reset-password').send({
      token: expired, password: 'newpass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  test('400 — valid JWT but already used (not in DB)', async () => {
    const token = jwt.sign({ email: 'ali@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    pool.execute.mockResolvedValueOnce([[]]); // cleared from DB
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'newpass123' });
    expect(res.status).toBe(400);
  });

  test('200 — valid JWT + matching DB row resets password', async () => {
    const token = jwt.sign({ email: 'ali@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    pool.execute
      .mockResolvedValueOnce([[{ id: 3 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'newpass456' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password reset successful/i);
  });
});
