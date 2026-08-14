# SafeStep

Stack Overlords - Hackelite 3.0

A women's safety companion built for Sri Lanka. Deter. Detect. Respond. Support - in Sinhala, Tamil, and English.

This is primarily the **web application** — see `STARTUP_COMMANDS.md` for how to run it. The same frontend is also packaged as an **Android app** via Capacitor (`frontend/android/`), which adds one native-only feature (a system-wide floating SOS bubble) on top of everything the web app does.

## Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React (Vite), react-router, react-leaflet, i18next (EN/SI/TA) |
| Backend    | Python, FastAPI, SQLAlchemy                   |
| Database   | PostgreSQL                                    |
| Auth       | JWT (OAuth2 password flow)                    |
| AI Chatbot | Pluggable LLM (Anthropic/OpenAI/Ollama) with a rule-based knowledge-base fallback that works with no API key |
| Voice input | Local speech-to-text via `faster-whisper` (Whisper), no API key needed |
| Email      | SMTP (SOS alerts, trusted-contact invites, password reset) |
| Android    | Capacitor wrapper (`frontend/android/`) + a native Java plugin (`SosOverlayPlugin`) for the system-wide SOS bubble |

## Project layout

```
SafeStep/
  backend/     FastAPI app, SQLAlchemy models, routers, chatbot service
  frontend/    React app (pages, components, i18n)
  docker-compose.yml   Postgres database for local dev
  STARTUP_COMMANDS.md  Copy-paste setup instructions for the team
```

## Features implemented (web vertical slice)

1. **AI Virtual Companion** - "Theatre Mode" fake incoming call (simulated ringtone + UI) and scheduled safety check-ins.
2. **Smart Route Intelligence** - crowd-sourced safety reports (safe/unsafe/well-lit/isolated/harassment/suspicious) rendered as a live heatmap.
3. **Privacy-First Emergency Response** - one-tap SOS with live location, trusted-contact notification (simulated), and automatic location wipe on resolve.
4. **Multilingual AI Support Chatbot** - Sinhala/Tamil/English, backed by a small legal/helpline knowledge base with optional LLM upgrade.
5. **Live location sharing** - revocable, expiring share links trusted contacts can open without an account.
6. **Verified Helper Network** - nearby seeded helpers (police stations, volunteers, safe houses) with distance sorting.

See `SafeStep_Proposal.pdf` for the full product proposal this build is based on.

## Getting started

See **[STARTUP_COMMANDS.md](./STARTUP_COMMANDS.md)** for full setup steps (database, backend, frontend).

## Deployment details

No hosted deployment for this submission — the app is designed to be run locally following [STARTUP_COMMANDS.md](./STARTUP_COMMANDS.md) (Postgres via Docker Compose, FastAPI via `uvicorn`, React via `vite dev`). There is no `Dockerfile`/`Procfile`/cloud manifest for the backend or frontend in this repo.

An Android build exists as a separate distribution target, wrapping the same React frontend with [Capacitor](https://capacitorjs.com/) (`frontend/android/`, config in `frontend/capacitor.config.json`) and talking to the same FastAPI backend over HTTP. It adds one native-only capability, a system-wide floating SOS bubble (`frontend/android/app/src/main/java/com/safestep/app/SosOverlayPlugin.java`, bridged from `frontend/src/native/sosOverlay.js`), which is a no-op on web.

## Architecture / system overview

```
 ┌─────────────────────────┐        ┌──────────────────────────┐
 │        Frontend         │        │      Android (optional)   │
 │  React (Vite), i18next  │        │  Capacitor WebView wrapper │
 │  react-leaflet maps     │        │  + native SosOverlayPlugin │
 └────────────┬─────────────┘        └────────────┬───────────┘
              │  REST/JSON, JWT bearer token       │
              ▼                                     ▼
 ┌──────────────────────────────────────────────────────────┐
 │                 Backend — FastAPI (Python)                │
 │  routers: auth, contacts, sos, routes, helpers,           │
 │  public_places, directions, chatbot, checkins, location   │
 │  services: mailer (SMTP), crypto (Fernet at-rest          │
 │  encryption), chatbot_service (LLM/rule-based),           │
 │  speech_service (local Whisper STT), directions,          │
 │  public_places, helper_lookup                             │
 └───────┬───────────────────┬───────────────────┬───────────┘
         │                   │                   │
         ▼                   ▼                   ▼
 ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐
 │  PostgreSQL    │  │ Anthropic/OpenAI │  │ Public geo APIs       │
 │ (SQLAlchemy)   │  │ /Ollama (chatbot, │  │ OSRM (walking routes) │
 │                │  │  optional)        │  │ Overpass (OSM places) │
 └───────────────┘  └─────────────────┘  └──────────────────────┘
```

The frontend is a single-page React app that talks to the FastAPI backend exclusively over versioned REST endpoints under `/api/*`, authenticated with a JWT obtained from `/api/auth`. The backend owns all persistence (PostgreSQL via SQLAlchemy models in `backend/app/models/`) and all outbound integrations (SMTP for SOS/invite/reset emails, the pluggable chatbot LLM, OSRM for directions, Overpass for nearby public places). The same frontend is packaged for Android via Capacitor, adding one native plugin for the always-on SOS bubble; every other feature runs identically in the browser and in the Android WebView.

**No physical hardware or IoT sensors are used or simulated.** Location data ("sensor input") comes from the standard browser Geolocation API (`frontend/src/utils/geo.js`, `navigator.geolocation`) on web, and from the device's real GPS via the same web API inside the Capacitor WebView on Android — there is no dummy/mocked sensor feed to describe, since the deployed code path is the real one a phone would use. `usePassiveLocationSync` (`frontend/src/hooks/usePassiveLocationSync.js`) polls this every 30s and `PUT`s `{latitude, longitude}` as plain JSON to `/api/location`, which is the same shape a native GPS integration would send.

## Technical Challenges & Creative Solutions

1. **Multilingual AI chatbot that stays reliable without an API key.** Sinhala/Tamil quality from small local LLMs is unreliable, and judges shouldn't need an API key to see the feature work. We built a hybrid: a keyword-scored retrieval layer over a curated legal/helpline knowledge base (`backend/app/data/knowledge_base.json`) grounds *every* answer (including LLM answers) so phone numbers/laws are never hallucinated, with the LLM (Anthropic/OpenAI/Ollama) as an optional upgrade and a rule-based responder as the always-available fallback. See [backend/app/services/chatbot_service.py](backend/app/services/chatbot_service.py).
2. **Privacy-first SOS without over-collecting location history.** Live location is needed during an active SOS, but retaining it afterwards is a liability. `resolve_sos` wipes `latitude`/`longitude` to `null` the moment an alert is resolved, while still keeping the alert record for history. See [backend/app/routers/sos.py](backend/app/routers/sos.py).
3. **Encryption-at-rest for chat history added after the fact.** Chat messages needed to be encrypted, but the table already had plaintext rows from earlier development/demo use. `encrypt_legacy_chat_messages` runs an idempotent backfill on every startup (`is_encrypted` short-circuits already-encrypted rows), so no manual migration step or downtime was needed. See [backend/app/services/crypto.py](backend/app/services/crypto.py).
4. **System-wide SOS access on Android without leaving the current app.** A woman in danger may not have SafeStep open. We added a native Capacitor plugin that draws a persistent floating bubble over other apps and fires the same `/api/sos/trigger` call directly, bridged through a small JS shim that keeps credentials in sync with the in-app button via a shared browser event. See [frontend/src/native/sosOverlay.js](frontend/src/native/sosOverlay.js) and `frontend/android/app/src/main/java/com/safestep/app/SosOverlayPlugin.java`.

## Scope Delivered

| Feature (from proposal) | Status |
|---|---|
| AI Virtual Companion (fake call, check-ins) | Implemented — `frontend/src/components/FakeCallModal.jsx`, `backend/app/routers/checkins.py` |
| Smart Route Intelligence (crowd-sourced safety heatmap) | Implemented — `backend/app/routers/routes.py`, `frontend/src/components/HeatmapLayer.jsx` |
| Privacy-First Emergency Response (SOS + auto location wipe) | Implemented — `backend/app/routers/sos.py` |
| SOS notification to trusted contacts | Implemented via real SMTP email, not SMS/push — no SMS provider is wired up; contacts without an email on file are reported as unreachable rather than silently skipped |
| Multilingual AI Support Chatbot (EN/SI/TA) | Implemented — LLM-upgradeable, rule-based by default, includes optional local voice input (Whisper) |
| Live location sharing (revocable expiring links) | Implemented — `frontend/src/pages/SharedLocation.jsx` |
| Verified Helper Network | Implemented, seeded with sample data around Colombo on first backend startup, plus live nearby hospitals/police/pharmacies pulled from OpenStreetMap (Overpass API) |
| Android app | Implemented as a Capacitor wrapper around the same web app, with an extra native floating SOS bubble not present on web |
| SMS/offline emergency alerts | Not implemented — no SMS gateway integrated; email is the only out-of-band SOS channel |
| Hardware/IoT wearable integration | Not implemented by choice — out of scope for the web/mobile-first slice; the proposal's location and alert flows are already satisfied by the device's own GPS |

## Anything else judges should note

- The chatbot's LLM upgrade path (Anthropic/OpenAI/Ollama) requires the judges' own API key in `backend/.env` to see LLM-quality answers; without one, it automatically runs the rule-based knowledge-base responder, which is fully functional but not conversational.
- Voice input for the chatbot runs a local Whisper model (`faster-whisper`) and is optional — it downloads a model on first use, so the first voice query will be slower.
- SOS emails require SMTP credentials in `backend/.env`; without them, SOS alerts still record correctly but `send_sos_alert_email` logs and returns `False` instead of sending, and contacts show up as "unreachable".
- The Android build (`frontend/android/`) requires Android Studio / the Android SDK to compile and hasn't been published to an app store — it's a local debug build for demo purposes.
- There is no Alembic migration tooling; schema changes ship as additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements run on backend startup (`backend/app/main.py`), which is sufficient for this project's size but wouldn't scale to a larger schema.

## Video submission link

https://youtu.be/xY6jUB1TcXs