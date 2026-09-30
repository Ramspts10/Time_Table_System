"""
Analytics API Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Institution, Timetable
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    svc = AnalyticsService(db)
    return svc.get_dashboard_metrics(inst.id)


@router.get("/rooms/{timetable_id}")
def get_room_analytics(timetable_id: str, db: Session = Depends(get_db)):
    svc = AnalyticsService(db)
    return svc.get_room_analytics(timetable_id)


@router.get("/faculty/{timetable_id}")
def get_faculty_analytics(timetable_id: str, db: Session = Depends(get_db)):
    svc = AnalyticsService(db)
    return svc.get_faculty_analytics(timetable_id)
