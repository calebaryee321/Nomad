# Nomad Backend

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

## Migrations

```bash
alembic upgrade head
```

## Test & Lint

```bash
pytest
ruff check .
black --check .
```
