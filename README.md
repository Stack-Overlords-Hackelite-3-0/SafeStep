# SafeStep

Stack Overlords - Hackelite 3.0

A women's safety companion built for Sri Lanka. Deter. Detect. Respond. Support - in Sinhala, Tamil, and English.

This is the **web application**. See `STARTUP_COMMANDS.md` for how to run it. A mobile build (via Capacitor) is planned as a follow-up on top of this same frontend.

## Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React (Vite), react-router, react-leaflet, i18next (EN/SI/TA) |
| Backend    | Python, FastAPI, SQLAlchemy                   |
| Database   | PostgreSQL                                    |
| Auth       | JWT (OAuth2 password flow)                    |
| AI Chatbot | Pluggable LLM (Anthropic/OpenAI) with a rule-based knowledge-base fallback that works with no API key |

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
