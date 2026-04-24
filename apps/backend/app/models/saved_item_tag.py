import uuid

from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SavedItemTag(Base):
    __tablename__ = "saved_item_tags"

    saved_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("saved_items.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

    saved_item = relationship("SavedItem", back_populates="tags")
    tag = relationship("Tag", back_populates="saved_items")
