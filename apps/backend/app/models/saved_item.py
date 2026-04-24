import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ProcessingStatus, SavedItemType, SourcePlatform


class SavedItem(Base):
    __tablename__ = "saved_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_platform: Mapped[SourcePlatform] = mapped_column(String(32), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_url: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    item_type: Mapped[SavedItemType] = mapped_column(
        String(32), default=SavedItemType.UNKNOWN.value
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    caption_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    collection_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("collections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    ai_category: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    ai_subcategory: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_confidence: Mapped[Decimal | None] = mapped_column(Numeric(4, 3), nullable=True)
    processing_status: Mapped[ProcessingStatus] = mapped_column(
        String(32), default=ProcessingStatus.PENDING.value, nullable=False, index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="saved_items")
    collection = relationship("Collection", back_populates="saved_items")
    tags = relationship("SavedItemTag", back_populates="saved_item", cascade="all, delete-orphan")
    processing_logs = relationship(
        "ProcessingLog", back_populates="saved_item", cascade="all, delete-orphan"
    )
