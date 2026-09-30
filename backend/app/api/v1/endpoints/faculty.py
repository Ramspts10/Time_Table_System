"""
Faculty Data & Availability API Endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Faculty
from backend.app.schemas.schemas import FacultyCreate, FacultyResponse

router = APIRouter()


@router.get("", response_model=List[FacultyResponse])
def get_all_faculty(db: Session = Depends(get_db)):
    return db.query(Faculty).all()


@router.post("", response_model=FacultyResponse)
def create_faculty(req: FacultyCreate, db: Session = Depends(get_db)):
    fac = Faculty(**req.dict())
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac


@router.put("/{faculty_id}", response_model=FacultyResponse)
def update_faculty(faculty_id: str, req: FacultyCreate, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for key, value in req.dict().items():
        setattr(fac, key, value)
    db.commit()
    db.refresh(fac)
    return fac
