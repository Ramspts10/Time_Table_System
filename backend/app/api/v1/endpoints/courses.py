"""
Course API Endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Course
from backend.app.schemas.schemas import CourseCreate, CourseResponse

router = APIRouter()


@router.get("", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@router.post("", response_model=CourseResponse)
def create_course(req: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**req.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course
