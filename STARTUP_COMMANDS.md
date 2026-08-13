# SafeStep - Startup Commands

Quick reference for getting the app running locally. Share this with the team.

Project layout:
```
SafeStep/
  backend/     FastAPI + PostgreSQL (Python)
  frontend/    React + Vite
    android/   Capacitor-wrapped Android app (same frontend + native SOS bubble)
  docker-compose.yml   Postgres database only
```

---

## 0. Prerequisites

Install once per machine:
- **Python 3.11+** - https://www.python.org/downloads/
- **Node.js 18+** (includes npm) - https://nodejs.org/
- **PostgreSQL 14+** - either install locally, OR use Docker Desktop and skip straight to option A below (recommended, no local Postgres install needed).
- **Docker Desktop** (recommended) - https://www.docker.com/products/docker-desktop/

---

## 1. Database - start PostgreSQL

### Option A: Docker (recommended - one command, no local install)
```bash
docker compose up -d
```
This starts Postgres on `localhost:5433` (mapped to the container's internal
5432, to avoid clashing with a PostgreSQL service you might already have
running locally on 5432) with:
- user: `safestep`
- password: `safestep`
- database: `safestep`

To stop it later: `docker compose down` (add `-v` to also wipe the data volume).

If port 5433 is also taken on your machine, edit the port mapping in
`docker-compose.yml` and the port in `backend/.env`'s `DATABASE_URL` to match.

### Option B: Local PostgreSQL install
Create the database and user yourself, e.g.:
```sql
CREATE USER safestep WITH PASSWORD 'safestep';
CREATE DATABASE safestep OWNER safestep;
```

---

## 2. Backend - FastAPI (Python)

```bash
cd backend

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

# Copy the example env file and adjust if needed
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

Backend is now running at **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

The database tables are created automatically on startup, and a handful of
sample verified helpers are seeded around Colombo the first time it runs.

> The AI chatbot works out of the box with a built-in rule-based responder
> (no API key needed). To wire up a real LLM (Sinhala/Tamil quality is much
> better), set in `backend/.env`:
> ```
> LLM_PROVIDER=anthropic
> ANTHROPIC_API_KEY=sk-ant-...
> ```
> or `LLM_PROVIDER=openai` with `OPENAI_API_KEY=...`.

---

## 3. Frontend - React (Vite)

Open a **second terminal**:

```bash
cd frontend
npm install

# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env

npm run dev
```

Frontend is now running at **http://localhost:5173**

---

## 4. Android app (optional)

The same frontend is also shipped as an Android app via [Capacitor](https://capacitorjs.com/), with one extra native-only feature: a system-wide floating SOS bubble. You don't need this for local web development — only if you want to build/run the Android app itself.

Extra prerequisites:
- **Android Studio** (includes the Android SDK) - https://developer.android.com/studio
- A running backend (step 2) reachable from the phone/emulator (see note below)

```bash
cd frontend
```

**Point the app at a reachable backend.** `localhost` inside an emulator or physical device refers to the device itself, not your machine, so `frontend/.env`'s `VITE_API_BASE_URL` needs to be:
- Android emulator: `http://10.0.2.2:8000` (the emulator's alias for the host machine)
- Physical device: `http://<your-machine's-LAN-IP>:8000` (device and machine must be on the same network), and `backend/.env`'s `CORS_ORIGINS` must include that origin

```bash
# Build the web app and sync it into the Android project
npm run android:sync

# Open the Android project in Android Studio to build/run on a device or emulator
npm run android:open

# Or build + install + launch directly (device/emulator must already be connected)
npm run android:run
```

The native SOS bubble (`android/app/src/main/java/com/safestep/app/SosOverlayPlugin.java`) only activates on Android — it's a no-op when running the same code as a website or in the browser preview.

---

## 5. Daily workflow (after first-time setup)

```bash
# Terminal 1 - database (skip if already running)
docker compose up -d

# Terminal 2 - backend
cd backend
venv\Scripts\Activate.ps1   # Windows, or: source venv/bin/activate  (macOS/Linux)
uvicorn app.main:app --reload --port 8000

# Terminal 3 - frontend
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Troubleshooting

- **"password authentication failed" / can't connect to DB** - make sure
  `docker compose up -d` is running, or that your local Postgres credentials
  match `backend/.env`'s `DATABASE_URL`.
- **CORS errors in the browser console** - confirm `frontend/.env`'s
  `VITE_API_BASE_URL` points at the backend (`http://localhost:8000`) and
  `backend/.env`'s `CORS_ORIGINS` includes `http://localhost:5173`.
- **Port already in use** - another process is using 8000 or 5173; stop it
  or change the port (`--port` for uvicorn, `server.port` in
  `frontend/vite.config.js`).
- **bcrypt / passlib error on install** - make sure `bcrypt==4.0.1` installed
  correctly (already pinned in `requirements.txt`); reinstall with
  `pip install -r requirements.txt --force-reinstall` if needed.
