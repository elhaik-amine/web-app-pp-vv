-- Khidmati Database Schema - Final Version

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
  avatar               VARCHAR(500),
  status               ENUM('ACTIVE','WARNED','RESTRICTED','SUSPENDED','BANNED') DEFAULT 'ACTIVE',
  suspended_until      DATETIME DEFAULT NULL,
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
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- ─── Provider Availability ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche',
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_day (provider_id, day_of_week)
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_id       INT  NOT NULL,
  provider_id     INT  NOT NULL,
  date_meeting    DATE NOT NULL,
  time_slot       ENUM('08:00-12:00','12:00-15:00','15:00-18:00','18:00-21:00') NOT NULL,
  status          ENUM('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  agreed_price    DECIMAL(10,2),
  estimated_price DECIMAL(10,2) DEFAULT NULL,
  qr_code         VARCHAR(64) UNIQUE,
  qr_active_from  DATETIME,
  qr_active_until DATETIME,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)   REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES users(id),
  UNIQUE KEY uq_provider_slot (provider_id, date_meeting, time_slot)
);

-- ─── Booking Photos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  type ENUM('BEFORE','AFTER') NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  sort_order TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT NOT NULL,
  sender_id       INT NOT NULL,
  content         TEXT NOT NULL,
  is_read         TINYINT(1) DEFAULT 0,
  is_negotiation  TINYINT(1) DEFAULT 0,
  proposed_price  DECIMAL(10,2) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)  REFERENCES users(id)
);

-- ─── Price Acceptances ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_acceptances (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id    INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  status     ENUM('PENDING', 'ACCEPTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_acceptance (booking_id, user_id)
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
  status           ENUM('PENDING','PENDING_REVIEW','UNDER_ADMIN_REVIEW','REVIEWED','AUTO_RESOLVED','RESOLVED','REJECTED') DEFAULT 'PENDING',
  admin_notes      TEXT,
  evidence_photo_url VARCHAR(500),
  evidence_latitude DECIMAL(10,7),
  evidence_longitude DECIMAL(10,7),
  evidence_captured_at DATETIME,
  response_deadline DATETIME,
  resolution_reason VARCHAR(255),
  resolved_at DATETIME,
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

-- ─── Token transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        ENUM('PURCHASE','DEDUCTION','REWARD','SPEND') NOT NULL,

  amount      DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  booking_id  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- ─── Insert default categories ────────────────────────────────────────────────
INSERT INTO service_categories (name, description, icon, is_active) VALUES
('Plomberie', 'Réparation et installation de plomberie', 'pipe-wrench', 1),
('Électricité', 'Installation et réparation électrique', 'lightning-bolt', 1),
('Ménage', 'Nettoyage et entretien de maison', 'broom', 1),
('Jardinage', 'Entretien de jardin et espaces verts', 'leaf', 1),
('Climatisation', 'Installation et réparation de climatisation', 'snowflake', 1),
('Peinture', 'Peinture et décoration', 'brush', 1),
('Menuiserie', 'Travaux de bois et meubles', 'hammer-wrench', 1),
('Plâtrerie', 'Plâtre et finitions', 'wall', 1);

-- ─── Insert admin user (password: 123456) ─────────────────────────────────────
INSERT INTO users (name, email, password, role, status) VALUES 
('Administrator', 'admin@khdimati.com', '$2a$10$4IejwDZszQIWqJEEZ/GXO9vAPL48IK4wQphgiufVbUKdyOMx.ePS', 'ADMIN', 'ACTIVE');

-- ─── Insert test client (password: 123456) ────────────────────────────────────
INSERT INTO users (name, email, password, phone, role, status) VALUES 
('Test Client', 'test@client.com', '$2a$10$4IejwDZszQIWqJEEZ/GXO9vAPL48IK4wQphgiufVbUKdyOMx.ePS', '0612345678', 'CLIENT', 'ACTIVE');

-- ─── Insert test provider (password: 123456) ──────────────────────────────────
INSERT INTO users (name, email, password, phone, role, status, token_balance) VALUES 
('Test Provider', 'test@provider.com', '$2a$10$4IejwDZszQIWqJEEZ/GXO9vAPL48IK4wQphgiufVbUKdyOMx.ePS', '0698765432', 'PROVIDER', 'ACTIVE', 5);

-- ─── Insert provider profile for test provider ────────────────────────────────
INSERT INTO provider_profiles (user_id, category_id, description, city, is_active, is_verified, rating, total_reviews) VALUES 
((SELECT id FROM users WHERE email = 'test@provider.com'), 1, 'Expert plombier professionnel avec 10 ans d''expérience. Intervention rapide à domicile.', 'Casablanca', 1, 1, 4.8, 25);

-- ─── Insert default availability for providers (all days available) ───────────
INSERT INTO provider_availability (provider_id, day_of_week, is_available)
SELECT id, day_num, 1
FROM users, (SELECT 1 as day_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) days
WHERE role = 'PROVIDER'
ON DUPLICATE KEY UPDATE is_available = 1;
