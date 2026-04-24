# 🌍 Nomad

Nomad is an Android-first Instagram saver and organizer with optional AI categorization.

## Repository layout

- `apps/backend` — FastAPI backend, SQLAlchemy models, Alembic migrations
- `apps/mobile` — React Native app workspace (initial scaffold)
- `packages/shared-types` — shared contracts/types workspace
- `infra` — infrastructure assets
- `docs` — product and technical specs

## Quickstart (backend)

```bash
cd /home/runner/work/Nomad/Nomad/apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload
```
