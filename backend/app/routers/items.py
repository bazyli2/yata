from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Item
from app.schemas import ItemCreate, ItemRead

router = APIRouter(prefix="/items", tags=["items"])


def _user_id(user: dict[str, Any]) -> str:
    """Extract the Auth0 ``sub`` claim (user ID) from the JWT payload."""
    return user["sub"]


@router.get("", response_model=list[ItemRead])
async def list_items(
    db: Session = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> list[Item]:
    uid = _user_id(user)
    return list(db.scalars(select(Item).where(Item.user_id == uid).order_by(Item.id)))


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> Item:
    uid = _user_id(user)
    item = Item(name=payload.name, description=payload.description, user_id=uid)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> Item:
    uid = _user_id(user)
    item = db.get(Item, item_id)
    if item is None or item.user_id != uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> None:
    uid = _user_id(user)
    item = db.get(Item, item_id)
    if item is None or item.user_id != uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    db.delete(item)
    db.commit()
