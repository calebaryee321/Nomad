"""add unique partial index on saved_items(user_id, normalized_url) where deleted_at is null

Revision ID: 20260424_0003
Revises: 20260424_0002
Create Date: 2026-04-24 16:00:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260424_0003"
down_revision: str | None = "20260424_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Postgres supports partial indexes via the `postgresql_where` kwarg.
    # SQLite supports the same with `sqlite_where`. Both backends are used in
    # this project (Postgres in prod, SQLite in tests/local).
    op.create_index(
        "uq_saved_items_user_normurl_active",
        "saved_items",
        ["user_id", "normalized_url"],
        unique=True,
        postgresql_where="deleted_at IS NULL",
        sqlite_where="deleted_at IS NULL",
    )


def downgrade() -> None:
    op.drop_index("uq_saved_items_user_normurl_active", table_name="saved_items")
