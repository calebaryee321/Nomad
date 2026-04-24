"""Tag endpoints (read-only; tags are managed via items)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import SavedItem, SavedItemTag, Tag, User
from app.schemas import TagOut

router = APIRouter()


@router.get("", response_model=list[TagOut])
def list_my_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TagOut]:
    stmt = (
        select(Tag)
        .join(SavedItemTag, SavedItemTag.tag_id == Tag.id)
        .join(SavedItem, SavedItem.id == SavedItemTag.saved_item_id)
        .where(SavedItem.user_id == current_user.id, SavedItem.deleted_at.is_(None))
        .order_by(Tag.name)
        .distinct()
    )
    return [TagOut.model_validate(t) for t in db.scalars(stmt).all()]
