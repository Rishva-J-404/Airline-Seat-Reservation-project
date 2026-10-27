# FlySmart Aviation System - REST API Documentation

This document describes the complete RESTful API specification for the **FlySmart Airline Seat Reservation System** backend.

## Base URL
- **Development**: `http://localhost:5000/api`
- **Default Port**: `5000` (configurable via `PORT` environment variable)

## Authentication & Headers
Protected endpoints require an `Authorization` header containing a valid JSON Web Token (JWT) issued during registration or login:
```http
Authorization: Bearer <jwt_token>
```
Standard content type:
```http
Content-Type: application/json
```

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Registration
Registers a new user account (passenger or admin) with bcrypt password hashing (10 salt rounds).

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: Public

#### Request Body:
```json
{
  "name": "Neavis Rishva",
  "email": "neavis.rishva@flysmart.demo",
  "password": "SecurePassword123!",
  "role": "passenger"
}
```

#### Responses:
- **201 Created**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "name": "Neavis Rishva",
      "email": "neavis.rishva@flysmart.demo",
      "role": "passenger"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```
- **400 Bad Request**: Input validation failure (missing name, invalid email format, or password < 6 chars).
- **409 Conflict**: Email is already registered.

---

### 1.2 User Login
Authenticates an existing user and returns a signed JWT token valid for 24 hours.

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: Public

#### Request Body:
```json
{
  "email": "neavis.rishva@flysmart.demo",
  "password": "SecurePassword123!"
}
```

#### Responses:
- **200 OK**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "name": "Neavis Rishva",
      "email": "neavis.rishva@flysmart.demo",
      "role": "passenger"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```
- **401 Unauthorized**: Invalid credentials or incorrect password.
- **404 Not Found**: User with specified email does not exist.

---

### 1.3 Get Current User Profile
Retrieves the profile of the currently authenticated user.

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Required (`Bearer <token>`)

#### Responses:
- **200 OK**:
  ```json
  {
    "user": {
      "id": 1,
      "name": "Neavis Rishva",
      "email": "neavis.rishva@flysmart.demo",
      "role": "passenger"
    }
  }
  ```
- **401 Unauthorized**: Missing, expired, or malformed JWT token.

---

## 2. Flight Management Endpoints (`/api/flights`)

### 2.1 List All Flights
Returns scheduled flights, with optional origin/destination filtering and server-side Selection Sort.

- **Method**: `GET`
- **Path**: `/api/flights`
- **Auth**: Public
- **Query Parameters**:
  - `from` *(optional)*: Origin city (e.g. `Coimbatore`)
  - `to` *(optional)*: Destination city (e.g. `Chennai`)
  - `sortBy` *(optional)*: Pass `price` to execute academic Selection Sort on the backend server.

#### Response (200 OK):
```json
{
  "count": 2,
  "flights": [
    {
      "id": 1,
      "flightNumber": "AI-201",
      "airline": "Air India",
      "from": "Coimbatore",
      "to": "Chennai",
      "departure": "08:30",
      "arrival": "10:00",
      "duration": "1h 30m",
      "price": 2500,
      "availableSeats": 49,
      "totalSeats": 80,
      "aircraft": "Airbus A320neo",
      "status": "scheduled"
    },
    {
      "id": 2,
      "flightNumber": "6E-402",
      "airline": "IndiGo",
      "from": "Coimbatore",
      "to": "Chennai",
      "departure": "10:15",
      "arrival": "11:45",
      "duration": "1h 30m",
      "price": 3200,
      "availableSeats": 49,
      "totalSeats": 80,
      "aircraft": "Airbus A320neo",
      "status": "scheduled"
    }
  ],
  "sortMetadata": {
    "algorithm": "Selection Sort",
    "comparisons": 1,
    "swaps": 0,
    "timeComplexity": "O(n^2)",
    "spaceComplexity": "O(1)"
  }
}
```

---

### 2.2 Get Flight Details
Retrieves detailed information for a single flight schedule.

- **Method**: `GET`
- **Path**: `/api/flights/:id`
- **Auth**: Public

#### Responses:
- **200 OK**: Flight object.
- **404 Not Found**: Flight with specified ID does not exist.

---

### 2.3 Get Aircraft Seat Layout
Retrieves the 80-seat matrix for a flight (20 rows x 4 columns) with real-time seat availability.

- **Method**: `GET`
- **Path**: `/api/flights/:id/seats`
- **Auth**: Public

#### Response (200 OK):
```json
{
  "flightId": 1,
  "totalSeats": 80,
  "seats": [
    {
      "id": 1,
      "seatNumber": "1A",
      "row": 1,
      "col": "A",
      "type": "window",
      "hasExtraLegroom": true,
      "isQuietZone": false,
      "isFrontRow": true,
      "status": "available"
    },
    {
      "id": 2,
      "seatNumber": "1B",
      "row": 1,
      "col": "B",
      "type": "aisle",
      "hasExtraLegroom": true,
      "isQuietZone": false,
      "isFrontRow": true,
      "status": "occupied"
    }
  ]
}
```

---

## 3. Reservation & Booking Pipeline Endpoints (`/api/reservations`)

### 3.1 Create Reservation
Enqueues booking request into FIFO intake queue, verifies seat availability, performs atomic seat assignment, updates passenger manifest linked list, and indexes into Binary Search Tree.

- **Method**: `POST`
- **Path**: `/api/reservations`
- **Auth**: Required (`Bearer <token>`)

#### Request Body:
```json
{
  "flightId": 1,
  "seatId": 1,
  "passengerName": "Neavis Rishva"
}
```

#### Responses:
- **201 Created**:
  ```json
  {
    "message": "Flight seat reservation successfully confirmed.",
    "reservation": {
      "id": 1,
      "bookingReference": "B1005",
      "flightNumber": "AI-201",
      "airline": "Air India",
      "origin": "Coimbatore",
      "destination": "Chennai",
      "departureTime": "08:30",
      "arrivalTime": "10:00",
      "seatNumber": "1A",
      "passengerName": "Neavis Rishva",
      "passengerIdCode": "P412",
      "totalFare": 2500,
      "status": "confirmed",
      "createdAt": "2026-09-30T09:15:00.000Z"
    },
    "dsaReceipt": {
      "co1_queue": "Processed via FIFO Request Intake Queue (O(1))",
      "co2_manifest": "Appended Neavis Rishva to manifest linked list tail (O(1))",
      "co3_bst": "Indexed booking key 1005 in Binary Search Tree (O(log n))"
    }
  }
  ```
- **400 Bad Request**: Missing mandatory reservation fields.
- **404 Not Found**: Flight or Seat ID not found.
- **409 Conflict**: Concurrency / Integrity violation: Seat is already reserved by another passenger.

---

### 3.2 List User Reservations
Retrieves all flight reservations made by the authenticated user.

- **Method**: `GET`
- **Path**: `/api/reservations`
- **Auth**: Required (`Bearer <token>`)

#### Response (200 OK):
```json
{
  "count": 1,
  "reservations": [
    {
      "id": 1,
      "bookingReference": "B1005",
      "flightNumber": "AI-201",
      "airline": "Air India",
      "origin": "Coimbatore",
      "destination": "Chennai",
      "departure": "08:30",
      "arrival": "10:00",
      "seatNumber": "1A",
      "passengerName": "Neavis Rishva",
      "totalFare": 2500,
      "status": "confirmed",
      "createdAt": "2026-09-30T09:15:00.000Z"
    }
  ]
}
```

---

### 3.3 Get Specific Reservation
Retrieves details for a single reservation. Enforces ownership authorization (users can only access their own reservations; admins can access any).

- **Method**: `GET`
- **Path**: `/api/reservations/:id`
- **Auth**: Required (`Bearer <token>`)

#### Responses:
- **200 OK**: Reservation details.
- **403 Forbidden**: User does not own the requested reservation.
- **404 Not Found**: Reservation ID not found.

---

### 3.4 Cancel Reservation
Cancels an existing flight reservation, unlinks the passenger record from the manifest linked list, and releases the assigned seat back to `available` status.

- **Method**: `DELETE`
- **Path**: `/api/reservations/:id`
- **Auth**: Required (`Bearer <token>`)

#### Responses:
- **200 OK**:
  ```json
  {
    "message": "Reservation B1005 successfully cancelled. Seat has been released.",
    "reservationId": 1,
    "status": "cancelled"
  }
  ```
- **400 Bad Request**: Reservation is already cancelled.
- **403 Forbidden**: User does not have permission to cancel this reservation.
- **404 Not Found**: Reservation ID not found.

---

## 4. System Health Endpoint

### 4.1 Health Check
Provides system operational status, active environment, and timestamp.

- **Method**: `GET`
- **Path**: `/api/health`
- **Auth**: Public

#### Response (200 OK):
```json
{
  "status": "healthy",
  "service": "Airline Seat Reservation System API",
  "environment": "development",
  "timestamp": "2026-09-30T09:20:00.000Z"
}
```
