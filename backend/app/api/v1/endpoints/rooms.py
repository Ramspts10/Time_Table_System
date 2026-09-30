"""
Room API Endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Room
from backend.app.schemas.schemas import RoomCreate, RoomResponse

router = APIRouter()


@router.get("", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()


@router.post("", response_model=RoomResponse)
def create_room(req: RoomCreate, db: Session = Depends(get_db)):
    room = Room(**req.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room
