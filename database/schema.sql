-- ============================================================
-- Airline Seat Reservation Relational Database Schema (PostgreSQL)
-- Normalized 3NF Relational Model with Referential Integrity
-- ============================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS waiting_list CASCADE;
DROP TABLE IF EXISTS reservation_seats CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS aircraft CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger', 'admin', 'crew')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ------------------------------------------------------------
-- 2. AIRCRAFT
-- ------------------------------------------------------------
CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    model VARCHAR(50) NOT NULL,              -- e.g. 'Airbus A320neo'
    total_rows INT NOT NULL DEFAULT 20,       -- 20 rows
    seats_per_row INT NOT NULL DEFAULT 4,     -- 4 seats per row (A, B, C, D)
    capacity INT NOT NULL DEFAULT 80          -- 80 total seats
);

-- ------------------------------------------------------------
-- 3. FLIGHTS
-- ------------------------------------------------------------
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'AI-201'
    airline VARCHAR(50) NOT NULL,              -- e.g. 'Air India'
    origin VARCHAR(50) NOT NULL,               -- e.g. 'Coimbatore'
    destination VARCHAR(50) NOT NULL,          -- e.g. 'Chennai'
    departure_time VARCHAR(20) NOT NULL,       -- e.g. '08:30'
    arrival_time VARCHAR(20) NOT NULL,         -- e.g. '10:00'
    duration VARCHAR(20) NOT NULL,             -- e.g. '1h 30m'
    base_price DECIMAL(10, 2) NOT NULL,        -- in INR
    aircraft_id INT REFERENCES aircraft(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flights_route ON flights(origin, destination);
CREATE INDEX idx_flights_number ON flights(flight_number);

-- ------------------------------------------------------------
-- 4. SEATS (Per Flight Cabin Matrix)
-- ------------------------------------------------------------
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    flight_id INT NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,          -- e.g. '12A'
    row_number INT NOT NULL,                   -- 1 to 20
    col_letter CHAR(1) NOT NULL,               -- 'A', 'B', 'C', 'D'
    seat_type VARCHAR(20) NOT NULL CHECK (seat_type IN ('window', 'aisle', 'middle')),
    has_extra_legroom BOOLEAN DEFAULT FALSE,   -- Rows 1, 10, 20
    is_quiet_zone BOOLEAN DEFAULT FALSE,       -- Rows 15-20
    is_front_row BOOLEAN DEFAULT FALSE,        -- Rows 1-5
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'blocked')),
    CONSTRAINT unique_flight_seat UNIQUE (flight_id, seat_number)
);

CREATE INDEX idx_seats_flight_status ON seats(flight_id, status);

-- ------------------------------------------------------------
-- 5. RESERVATIONS
-- ------------------------------------------------------------
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'B1001'
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    flight_id INT NOT NULL REFERENCES flights(id) ON DELETE RESTRICT,
    total_fare DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_ref ON reservations(booking_reference);

-- ------------------------------------------------------------
-- 6. RESERVATION_SEATS (Mapping Seats to Reservations)
-- Note: Does NOT enforce unconditional UNIQUE(seat_id) so cancelled
-- reservations retain historical audit integrity while releasing seats
-- for subsequent bookings. Active concurrency is enforced via
-- single-client transaction row locks (SELECT ... FOR UPDATE on seats).
-- ------------------------------------------------------------
CREATE TABLE reservation_seats (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_id_code VARCHAR(20) NOT NULL     -- e.g. 'P101'
);

CREATE INDEX idx_res_seats_res ON reservation_seats(reservation_id);
CREATE INDEX idx_res_seats_seat ON reservation_seats(seat_id);

-- ------------------------------------------------------------
-- 7. WAITING_LIST (CO1: FIFO Waiting List Queue for Full Flights)
-- ------------------------------------------------------------
CREATE TABLE waiting_list (
    id SERIAL PRIMARY KEY,
    flight_id INT NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passenger_name VARCHAR(100) NOT NULL,
    request_id VARCHAR(30) UNIQUE NOT NULL,      -- e.g. 'WL-101'
    seat_preference VARCHAR(30) DEFAULT 'any',
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waiting_list_flight ON waiting_list(flight_id, status, created_at);
