"""add password_hash and require email on users

Revision ID: 20260424_0002
Revises: 20260424_0001
Create Date: 2026-04-24 14:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260424_0002"
down_revision: str | None = "20260424_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add password_hash. Use a server_default for the in-place ALTER, then drop it
    # so future inserts must supply a real hash.
    op.add_column(
        "users",
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
            server_default="!",  # placeholder; not a valid bcrypt hash
        ),
    )
    op.alter_column("users", "password_hash", server_default=None)

    # Email is required going forward.
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=False)


def downgrade() -> None:
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=True)
    op.drop_column("users", "password_hash")
