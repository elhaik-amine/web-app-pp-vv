const jwt = require('jsonwebtoken');

// ─── Token ──────────────────────────────────────────────────────────────────

const makeToken = (payload = {}) =>
  jwt.sign({ id: 1, ...payload }, process.env.JWT_SECRET, { expiresIn: '1h' });

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Minimal user row as returned by protect middleware (SELECT id,name,email,role,status,token_balance).
 * Represents a CLIENT by default.
 */
const mockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test Client',
  email: 'client@test.com',
  role: 'CLIENT',
  status: 'ACTIVE',
  token_balance: 5,
  ...overrides,
});

/**
 * Provider user row — includes provider_profiles fields because
 * loginProvider JOINs both tables.
 */
const mockProvider = (overrides = {}) => ({
  id: 2,
  name: 'Test Provider',
  email: 'provider@test.com',
  role: 'PROVIDER',
  status: 'ACTIVE',
  token_balance: 3,
  avatar: 'https://res.cloudinary.com/demo/provider.jpg',
  // provider_profiles fields (from auth JOIN)
  bio: 'Experienced plumber',
  city: 'Casablanca',
  years_experience: 5,
  starting_price: 150.00,
  rating: 4.5,
  total_reviews: 10,
  is_verified: 1,
  category_id: 1,
  ...overrides,
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * Minimal booking row as stored in the bookings table.
 */
const mockBooking = (overrides = {}) => ({
  id: 1,
  client_id: 1,
  provider_id: 2,
  booking_date: '2026-06-01',
  time_slot: '08:00-12:00',
  status: 'PENDING',
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Booking row enriched with JOIN fields (as returned by getBookings / getBookingById).
 */
const mockBookingDetails = (overrides = {}) => ({
  ...mockBooking(),
  client_name: 'Test Client',
  client_phone: '0600000000',
  provider_name: 'Test Provider',
  provider_phone: '0611111111',
  category_name: 'Plumbing',
  ...overrides,
});

module.exports = {
  makeToken,
  mockUser,
  mockProvider,
  mockBooking,
  mockBookingDetails,
};
