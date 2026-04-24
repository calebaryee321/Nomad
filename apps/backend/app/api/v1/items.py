"""Saved item endpoints (URL link organizer)."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_db
from app.models import Collection, SavedItem, SavedItemTag, Tag, User
from app.models.enums import ProcessingStatus
from app.schemas import SavedItemCreate, SavedItemOut, SavedItemUpdate
from app.services.url_normalizer import normalize_url

router = APIRouter()


def _to_out(item: SavedItem) -> SavedItemOut:
    data: dict[str, Any] = {
        "id": item.id,
        "source_platform": item.source_platform,
        "source_url": item.source_url,
        "normalized_url": item.normalized_url,
        "item_type": item.item_type,
        "title": item.title,
        "user_note": item.user_note,
        "collection_id": item.collection_id,
        "processing_status": item.processing_status,
        "tags": sorted({link.tag.name for link in item.tags if link.tag is not None}),
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
    return SavedItemOut.model_validate(data)


def _ensure_collection_owned(db: Session, user: User, collection_id: uuid.UUID | None) -> None:
    if collection_id is None:
        return
    owned = db.scalar(
        select(Collection.id).where(Collection.id == collection_id, Collection.user_id == user.id)
    )
    if owned is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection does not exist or does not belong to you",
        )


def _resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    cleaned = sorted({n.strip().lower() for n in names if n and n.strip()})
    if not cleaned:
        return []
    existing = {t.name: t for t in db.scalars(select(Tag).where(Tag.name.in_(cleaned))).all()}
    tags: list[Tag] = []
    for name in cleaned:
        tag = existing.get(name)
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def _query_owned_item(db: Session, user: User, item_id: uuid.UUID) -> SavedItem:
    item = db.scalar(
        select(SavedItem)
        .options(selectinload(SavedItem.tags).selectinload(SavedItemTag.tag))
        .where(
            SavedItem.id == item_id,
            SavedItem.user_id == user.id,
            SavedItem.deleted_at.is_(None),
        )
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.get("", response_model=list[SavedItemOut])
def list_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    collection_id: uuid.UUID | None = Query(default=None),
    q: str | None = Query(default=None, description="Search title, note, or URL"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[SavedItemOut]:
    stmt = (
        select(SavedItem)
        .options(selectinload(SavedItem.tags).selectinload(SavedItemTag.tag))
        .where(SavedItem.user_id == current_user.id, SavedItem.deleted_at.is_(None))
        .order_by(SavedItem.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if collection_id is not None:
        stmt = stmt.where(SavedItem.collection_id == collection_id)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                SavedItem.title.ilike(like),
                SavedItem.user_note.ilike(like),
                SavedItem.normalized_url.ilike(like),
            )
        )
    rows = db.scalars(stmt).all()
    return [_to_out(item) for item in rows]


@router.post("", response_model=SavedItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: SavedItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedItemOut:
    try:
        normalized = normalize_url(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    _ensure_collection_owned(db, current_user, payload.collection_id)

    # Dedupe per user by normalized_url (return existing item if already saved).
    existing = db.scalar(
        select(SavedItem)
        .options(selectinload(SavedItem.tags).selectinload(SavedItemTag.tag))
        .where(
            SavedItem.user_id == current_user.id,
            SavedItem.normalized_url == normalized.normalized_url,
            SavedItem.deleted_at.is_(None),
        )
    )
    if existing is not None:
        return _to_out(existing)

    item = SavedItem(
        user_id=current_user.id,
        source_platform=normalized.source_platform.value,
        source_url=normalized.source_url,
        normalized_url=normalized.normalized_url,
        item_type=normalized.item_type.value,
        title=payload.title,
        user_note=payload.user_note,
        collection_id=payload.collection_id,
        processing_status=ProcessingStatus.PENDING.value,
    )
    db.add(item)
    try:
        db.flush()
    except IntegrityError:
        # Another request created the same (user_id, normalized_url) row
        # between our SELECT above and this INSERT. Roll back and return the
        # row that won the race so the share-intent flow stays idempotent.
        db.rollback()
        winner = db.scalar(
            select(SavedItem)
            .options(selectinload(SavedItem.tags).selectinload(SavedItemTag.tag))
            .where(
                SavedItem.user_id == current_user.id,
                SavedItem.normalized_url == normalized.normalized_url,
                SavedItem.deleted_at.is_(None),
            )
        )
        if winner is None:
            # Extremely unlikely: index conflict but no row is visible. Surface
            # a 409 rather than a confusing 500.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Could not save link due to a concurrent update; please retry",
            ) from None
        return _to_out(winner)

    for tag in _resolve_tags(db, payload.tags):
        db.add(SavedItemTag(saved_item_id=item.id, tag_id=tag.id))

    db.commit()
    db.refresh(item)
    return _to_out(item)


@router.get("/{item_id}", response_model=SavedItemOut)
def get_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedItemOut:
    return _to_out(_query_owned_item(db, current_user, item_id))


@router.patch("/{item_id}", response_model=SavedItemOut)
def update_item(
    item_id: uuid.UUID,
    payload: SavedItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedItemOut:
    item = _query_owned_item(db, current_user, item_id)
    data = payload.model_dump(exclude_unset=True)

    if "collection_id" in data:
        _ensure_collection_owned(db, current_user, data["collection_id"])
        item.collection_id = data["collection_id"]
    if "title" in data:
        item.title = data["title"]
    if "user_note" in data:
        item.user_note = data["user_note"]
    if "tags" in data and data["tags"] is not None:
        # Replace tag set.
        for link in list(item.tags):
            db.delete(link)
        db.flush()
        for tag in _resolve_tags(db, data["tags"]):
            db.add(SavedItemTag(saved_item_id=item.id, tag_id=tag.id))

    db.commit()
    db.refresh(item)
    return _to_out(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    item = _query_owned_item(db, current_user, item_id)
    db.delete(item)
    db.commit()
