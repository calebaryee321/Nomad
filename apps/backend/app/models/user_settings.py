import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ProcessingMode


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    provider_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    encrypted_api_key: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    processing_mode: Mapped[ProcessingMode] = mapped_column(
        String(32), default=ProcessingMode.MANUAL.value, nullable=False
    )
    image_analysis_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deeper_enrichment_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    budget_cap: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="settings")
