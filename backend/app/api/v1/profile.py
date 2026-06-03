"""Profile routes: saved items/bookmarks."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db import collections
from app.db.mongodb import get_database
from app.models.saved import SavedItem


router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/saved", response_model=list[SavedItem])
async def list_saved(user=Depends(get_current_user), db=Depends(get_database)) -> list[SavedItem]:
    user_id = str(user._id)
    cursor = db[collections.SAVED_ITEMS].find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return [SavedItem(**d) for d in docs if isinstance(d, dict)]


@router.post("/saved", response_model=SavedItem)
async def save_item(item: SavedItem, user=Depends(get_current_user), db=Depends(get_database)) -> SavedItem:
    user_id = str(user._id)
    item.user_id = user_id
    await db[collections.SAVED_ITEMS].insert_one(item.model_dump())
    return item


@router.delete("/saved/{item_id}")
async def delete_item(item_id: str, user=Depends(get_current_user), db=Depends(get_database)) -> dict[str, bool]:
    user_id = str(user._id)
    res = await db[collections.SAVED_ITEMS].delete_one({"user_id": user_id, "item_id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return {"deleted": True}
