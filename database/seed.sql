-- ============================================================
-- Airline Seat Reservation Relational Database Seed Data
-- ============================================================

-- ------------------------------------------------------------
-- 1. SEED AIRCRAFT
-- ------------------------------------------------------------
INSERT INTO aircraft (id, model, total_rows, seats_per_row, capacity) VALUES
(1, 'Airbus A320neo', 20, 4, 80),
(2, 'Boeing 737-800', 20, 4, 80),
(3, 'Airbus A321', 20, 4, 80);

SELECT setval(pg_get_serial_sequence('aircraft', 'id'), coalesce(max(id), 1)) FROM aircraft;

-- ------------------------------------------------------------
-- 2. SEED USERS (Password for all demo users is: password123)
-- Hash generated via bcrypt 10 rounds: $2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje
-- ------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Neavis Rishva', 'neavis.rishva@flysmart.demo', '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje', 'passenger'),
(2, 'Priya Sharma', 'priya.sharma@flysmart.demo', '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje', 'passenger'),
(3, 'Flight Operations Admin', 'admin@flysmart.demo', '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje', 'admin');

SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;

-- ------------------------------------------------------------
-- 3. SEED FLIGHTS
-- Note: Flight 6 (AI-999) is fully booked to demonstrate CO1 FIFO Waiting Queue!
-- ------------------------------------------------------------
INSERT INTO flights (id, flight_number, airline, origin, destination, departure_time, arrival_time, duration, base_price, aircraft_id, status) VALUES
(1, 'AI-201', 'Air India', 'Coimbatore', 'Chennai', '08:30', '10:00', '1h 30m', 2500.00, 1, 'scheduled'),
(2, '6E-402', 'IndiGo', 'Coimbatore', 'Chennai', '10:15', '11:45', '1h 30m', 3200.00, 1, 'scheduled'),
(3, 'SG-112', 'SpiceJet', 'Coimbatore', 'Mumbai', '13:00', '15:20', '2h 20m', 4800.00, 2, 'scheduled'),
(4, 'UK-305', 'Vistara', 'Chennai', 'Delhi', '06:45', '09:15', '2h 30m', 5500.00, 3, 'scheduled'),
(5, 'AI-410', 'Air India', 'Mumbai', 'Bangalore', '16:30', '18:00', '1h 30m', 6200.00, 1, 'scheduled'),
(6, 'AI-999', 'Air India', 'Coimbatore', 'Chennai', '18:30', '20:00', '1h 30m', 3500.00, 1, 'scheduled');

SELECT setval(pg_get_serial_sequence('flights', 'id'), coalesce(max(id), 1)) FROM flights;

-- ------------------------------------------------------------
-- 4. FUNCTION / LOOP TO POPULATE 80 SEATS PER FLIGHT
-- ------------------------------------------------------------
DO $$
DECLARE
    f RECORD;
    r INT;
    c CHAR(1);
    s_id VARCHAR(10);
    s_type VARCHAR(20);
    has_legroom BOOLEAN;
    is_quiet BOOLEAN;
    is_front BOOLEAN;
    is_occupied BOOLEAN;
BEGIN
    FOR f IN SELECT id FROM flights LOOP
        FOR r IN 1..20 LOOP
            FOR c IN ('A', 'B', 'C', 'D') LOOP
                s_id := r || c;
                s_type := CASE WHEN c IN ('A', 'D') THEN 'window' ELSE 'aisle' END;
                has_legroom := r IN (1, 10, 20);
                is_quiet := r >= 15;
                is_front := r <= 5;

                -- For Flight 6 (AI-999), 100% of seats are occupied to showcase Waiting Queue
                IF f.id = 6 THEN
                    is_occupied := TRUE;
                ELSE
                    -- Standard pre-occupied seats for realism
                    is_occupied := s_id IN (
                        '1B','1C','2A','2D','3B','4A','4C','5B','5D',
                        '6A','6B','7C','7D','8A','9B','9C','10D',
                        '11A','11B','12C','13A','13D','14B','14C',
                        '15A','16B','17C','17D','18A','19B','20C'
                    );
                END IF;

                INSERT INTO seats (flight_id, seat_number, row_number, col_letter, seat_type, has_extra_legroom, is_quiet_zone, is_front_row, status)
                VALUES (
                    f.id,
                    s_id,
                    r,
                    c,
                    s_type,
                    has_legroom,
                    is_quiet,
                    is_front,
                    CASE WHEN is_occupied THEN 'occupied' ELSE 'available' END
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
