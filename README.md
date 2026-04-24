# 🌍 Nomad

Nomad is an Android-first **Instagram link organizer**: tap **Share → Nomad**
on any Instagram post or reel and the app saves the link, your notes, and your
tags to your own backend. No Instagram media is downloaded — Nomad stores only
the URL plus the metadata you choose to add.

## Repository layout

- `apps/backend` — FastAPI backend (auth, collections, items, tags), SQLAlchemy models, Alembic migrations
- `apps/mobile` — React Native (TypeScript) Android app with a Kotlin share-intent receiver
- `packages/shared-types` — TypeScript wire-format types shared backend ↔ app
- `infra` — infrastructure assets
- `docs` — product and technical specs

## End-to-end share flow

1. User opens an Instagram post/reel → **Share → Nomad**.
2. Android delivers `Intent.ACTION_SEND` (`text/plain`) to the Nomad activity.
3. The native `ShareReceiver` Kotlin module captures the URL.
4. The RN app reads it via `consumeSharedText()` and opens the **Add item**
   screen with the URL pre-filled.
5. The user adds optional notes/tags and taps **Save**.
6. The app `POST`s to `/api/v1/items`, the backend normalizes the URL
   (`/p/`, `/reel/`, `/tv/` shortcodes are canonicalized) and stores the
   record. Re-sharing the same Instagram link returns the existing item
   (per-user dedupe).

## Quickstart

### Backend

```bash
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]
# Postgres for prod (see docker-compose.yml). For local hacking against SQLite:
NOMAD_DATABASE_URL=sqlite+pysqlite:///./nomad.db uvicorn app.main:app --reload
```

Run the test suite:

```bash
cd apps/backend && pytest
```

### Mobile (Android)

```bash
npm install                                    # from repo root (workspaces)
npm --workspace @nomad/mobile run lint
npm --workspace @nomad/mobile run test

cd apps/mobile && npx react-native run-android # debug build on a device/emulator
# or: cd android && ./gradlew assembleDebug
```

The default API URL is `http://10.0.2.2:8000` (the Android emulator's alias
for the host machine's `localhost`). Override with `NOMAD_API_BASE_URL`.

## What this app deliberately does NOT do

- It does **not** scrape, download, or rehost Instagram media. Only the URL
  and your own notes/tags are stored.
- It does **not** authenticate with Instagram. You can save any link you can
  paste or share into Android.
