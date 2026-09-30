"""
Section API Endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Section
from backend.app.schemas.schemas import SectionCreate, SectionResponse

router = APIRouter()


@router.get("", response_model=List[SectionResponse])
def get_sections(db: Session = Depends(get_db)):
    return db.query(Section).all()


@router.post("", response_model=SectionResponse)
def create_section(req: SectionCreate, db: Session = Depends(get_db)):
    sec = Section(**req.dict())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec
