-- Khidmati Database Schema

CREATE DATABASE IF NOT EXISTS khidmati;
USE khidmati;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(255) NOT NULL,
  email                VARCHAR(255) NOT NULL UNIQUE,
  password             VARCHAR(255) NOT NULL,
  phone                VARCHAR(20),
  role                 ENUM('CLIENT','PROVIDER','ADMIN') DEFAULT 'CLIENT',
  avatar               VARCHAR(255),
  status               ENUM('ACTIVE','WARNED','RESTRICTED','SUSPENDED') DEFAULT 'ACTIVE',
  token_balance        DECIMAL(10,2) DEFAULT 0,
  reset_token          VARCHAR(500),
  reset_token_expires  DATETIME,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Service categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  icon        VARCHAR(255),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Provider profiles ────────────────────────────────────────────────────────
-- The provider profile IS the service.
-- description explains everything the provider can do.
-- No separate offers table — clients browse profiles and book directly.
CREATE TABLE IF NOT EXISTS provider_profiles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL UNIQUE,
  category_id   INT,
  description   TEXT,
  city          VARCHAR(255),
  is_active     TINYINT(1)   DEFAULT 1,
  is_verified   TINYINT(1)   DEFAULT 0,
  rating        DECIMAL(3,2) DEFAULT 0,
  total_reviews INT          DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)              ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
-- Client books a provider directly for a date + time slot.
-- Slot availability is derived from this table — no separate availability table needed.
-- UNIQUE on (provider_id, booking_date, time_slot) blocks double-booking at DB level.
CREATE TABLE IF NOT EXISTS bookings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  client_id    INT  NOT NULL,
  provider_id  INT  NOT NULL,
  booking_date DATE NOT NULL,
  time_slot    ENUM('08:00-12:00','12:00-15:00','15:00-18:00','18:00-21:00') NOT NULL,
  status        ENUM('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  agreed_price  DECIMAL(10,2),              -- price agreed on in chat before arrival
  qr_code       VARCHAR(64) UNIQUE,         -- token generated on confirm, scanned by client on arrival
  notes         TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)   REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES users(id),
  UNIQUE KEY uq_provider_slot (provider_id, booking_date, time_slot)
);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL UNIQUE,
  client_id   INT NOT NULL,
  provider_id INT NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id),
  FOREIGN KEY (client_id)   REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id      INT NOT NULL,
  reported_user_id INT,
  booking_id       INT,
  type             ENUM('NOSHOW','ABSENT','OTHER') NOT NULL,
  description      TEXT,
  status           ENUM('PENDING','REVIEWED','RESOLVED') DEFAULT 'PENDING',
  admin_notes      TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id)      REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id)       REFERENCES bookings(id) ON DELETE SET NULL
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255),
  message    TEXT,
  data       TEXT,
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Messages ────────────────────────────────────────────────────────────────
-- Chat between client and provider, scoped to a confirmed booking.
-- Sending is only allowed while booking is PENDING or CONFIRMED.
CREATE TABLE IF NOT EXISTS messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT  NOT NULL,
  sender_id  INT  NOT NULL,
  content    TEXT NOT NULL,
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)  REFERENCES users(id)
);

-- ─── Token transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        ENUM('PURCHASE','DEDUCTION','REWARD') NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  booking_id  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);
