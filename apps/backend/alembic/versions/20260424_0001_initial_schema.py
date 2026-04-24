"""initial schema

Revision ID: 20260424_0001
Revises:
Create Date: 2026-04-24 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260424_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
    )
    op.create_index("ix_tags_name", "tags", ["name"], unique=True)

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("icon", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"])

    op.create_table(
        "user_settings",
        sa.Column(
            "user_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("provider_name", sa.String(length=100), nullable=True),
        sa.Column("encrypted_api_key", sa.String(length=2048), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("processing_mode", sa.String(length=32), nullable=False, server_default="manual"),
        sa.Column(
            "image_analysis_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "deeper_enrichment_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("budget_cap", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    op.create_table(
        "saved_items",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_platform", sa.String(length=32), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("normalized_url", sa.Text(), nullable=False),
        sa.Column("item_type", sa.String(length=32), nullable=False, server_default="unknown"),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("caption_text", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("media_uri", sa.Text(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("user_note", sa.Text(), nullable=True),
        sa.Column(
            "collection_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("collections.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("ai_category", sa.String(length=80), nullable=True),
        sa.Column("ai_subcategory", sa.String(length=80), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column(
            "processing_status", sa.String(length=32), nullable=False, server_default="pending"
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_saved_items_user_id", "saved_items", ["user_id"])
    op.create_index("ix_saved_items_collection_id", "saved_items", ["collection_id"])
    op.create_index("ix_saved_items_normalized_url", "saved_items", ["normalized_url"])
    op.create_index("ix_saved_items_ai_category", "saved_items", ["ai_category"])
    op.create_index("ix_saved_items_ai_subcategory", "saved_items", ["ai_subcategory"])
    op.create_index("ix_saved_items_processing_status", "saved_items", ["processing_status"])

    op.create_table(
        "saved_item_tags",
        sa.Column(
            "saved_item_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("saved_items.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "tag_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
    )

    op.create_table(
        "processing_logs",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "saved_item_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("saved_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("stage", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_processing_logs_saved_item_id", "processing_logs", ["saved_item_id"])


def downgrade() -> None:
    op.drop_index("ix_processing_logs_saved_item_id", table_name="processing_logs")
    op.drop_table("processing_logs")

    op.drop_table("saved_item_tags")

    op.drop_index("ix_saved_items_processing_status", table_name="saved_items")
    op.drop_index("ix_saved_items_ai_subcategory", table_name="saved_items")
    op.drop_index("ix_saved_items_ai_category", table_name="saved_items")
    op.drop_index("ix_saved_items_normalized_url", table_name="saved_items")
    op.drop_index("ix_saved_items_collection_id", table_name="saved_items")
    op.drop_index("ix_saved_items_user_id", table_name="saved_items")
    op.drop_table("saved_items")

    op.drop_table("user_settings")

    op.drop_index("ix_collections_user_id", table_name="collections")
    op.drop_table("collections")

    op.drop_index("ix_tags_name", table_name="tags")
    op.drop_table("tags")

    op.drop_table("users")
