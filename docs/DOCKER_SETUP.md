# FlySmart Aviation System - Containerized Docker Setup Guide

This document describes how to deploy the **FlySmart Airline Seat Reservation System & DSA Laboratory** using Docker and Docker Compose.

---

## 1. Container Architecture

The Docker setup encapsulates the full application stack into three isolated, networked services:

```text
┌─────────────────────────────────────────────────────────────────┐
│                       Host Machine                              │
│                                                                 │
│   Port 5173 (Browser)         Port 5000               Port 5432 │
│        │                          │                       │     │
│        ▼                          ▼                       ▼     │
│   ┌──────────────┐         ┌──────────────┐        ┌──────────┐ │
│   │   frontend   │         │   backend    │        │ postgres │ │
│   │ (Nginx / SPA)│────/api/───▶ (Node API)│───────▶│ (DB 15)  │ │
│   └──────────────┘         └──────────────┘        └──────────┘ │
│                                                          │      │
│                                                    postgres_data│
│                                                    (Persisted)  │
└─────────────────────────────────────────────────────────────────┘
```

### Services Summary:
| Service | Base Image | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend`** | `nginx:alpine` (multi-stage) | 80 | **5173** | Serves compiled React SPA bundle and proxies `/api/*` |
| **`backend`** | `node:20-alpine` | 5000 | **5000** | Runs Express REST API with relational pool and DSA layer |
| **`postgres`** | `postgres:15-alpine` | 5432 | **5432** | Persistent relational storage initialized with schema & seed |

---

## 2. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows / Linux) or Docker Engine with Docker Compose v2.

---

## 3. Quick Start Deployment

### Step 1: Clone Repository & Enter Root Directory
```bash
git clone https://github.com/Rishva-J-404/Airline-Seat-Reservation-project.git
cd Airline-Seat-Reservation-project
```

### Step 2: Configure Environment (Optional)
```bash
# Copy default environment configuration
cp .env.example .env
```

### Step 3: Build & Launch Containers
```bash
# Build and run all 3 services in the background
docker compose up --build -d
```

### Step 4: Verify Service Health
```bash
# Check running container statuses
docker compose ps
```
Expected output:
```text
NAME                     IMAGE                  STATUS                   PORTS
airline_dsa_postgres     postgres:15-alpine     Up (healthy)             0.0.0.0:5432->5432/tcp
airline_dsa_backend      airline-dsa-backend    Up (healthy)             0.0.0.0:5000->5000/tcp
airline_dsa_frontend     airline-dsa-frontend   Up                       0.0.0.0:5173->80/tcp
```

### Step 5: Access the Application
- **Frontend Web UI**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API Health**: Open [http://localhost:5000/api/health](http://localhost:5000/api/health).
- **PostgreSQL Database**: Connect to `localhost:5432` with username `postgres`, password `postgres`, database `airline_dsa`.

---

## 4. Container Management & Diagnostics

### View Service Logs
```bash
# Stream all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View database initialization logs
docker compose logs postgres
```

### Run Backend Tests Inside Container
```bash
docker compose exec backend npm test
```

### Access Database CLI
```bash
docker compose exec postgres psql -U postgres -d airline_dsa
```

### Shutdown Containers & Preserve Data
```bash
docker compose down
```

### Shutdown & Remove Persisted Volumes
```bash
docker compose down -v
```

---

## 5. Non-Docker Local Fallback (Development Mode)
If running in an environment without the Docker daemon installed (e.g. university lab terminals):
1. **Frontend**:
   ```bash
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   # Runs on http://localhost:5000
   ```
FlySmart automatically uses in-memory mocked databases when PostgreSQL is unavailable, ensuring 100% offline functionality.
