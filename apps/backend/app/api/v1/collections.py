"""Collection CRUD endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Collection, User
from app.schemas import CollectionCreate, CollectionOut, CollectionUpdate

router = APIRouter()


def _get_owned(db: Session, user: User, collection_id: uuid.UUID) -> Collection:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == user.id)
    )
    if collection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection


@router.get("", response_model=list[CollectionOut])
def list_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CollectionOut]:
    rows = db.scalars(
        select(Collection).where(Collection.user_id == current_user.id).order_by(Collection.name)
    ).all()
    return [CollectionOut.model_validate(c) for c in rows]


@router.post("", response_model=CollectionOut, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CollectionOut:
    collection = Collection(
        user_id=current_user.id,
        name=payload.name,
        color=payload.color,
        icon=payload.icon,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return CollectionOut.model_validate(collection)


@router.patch("/{collection_id}", response_model=CollectionOut)
def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CollectionOut:
    collection = _get_owned(db, current_user, collection_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(collection, key, value)
    db.commit()
    db.refresh(collection)
    return CollectionOut.model_validate(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    collection = _get_owned(db, current_user, collection_id)
    db.delete(collection)
    db.commit()
