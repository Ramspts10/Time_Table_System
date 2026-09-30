"""
Timetable Generation, Management, Validation, Repair & Simulation API Endpoints.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import Timetable, Institution, TimetableEntry
from backend.app.schemas.schemas import (
    GenerateTimetableRequest, ManualEditEntryRequest, RepairRequest, WhatIfRequest
)
from backend.app.services.timetable_service import TimetableService

router = APIRouter()


@router.post("/generate")
def generate_timetable(req: GenerateTimetableRequest, db: Session = Depends(get_db)):
    inst = db.query(Institution).first()
    if not inst:
        raise HTTPException(status_code=404, detail="No institution found. Run seed data first.")

    svc = TimetableService(db)
    tt = svc.generate_timetable(
        institution_id=inst.id,
        name=req.name,
        academic_term=req.academic_term,
        time_limit_seconds=req.time_limit_seconds
    )
    return {
        "id": tt.id,
        "name": tt.name,
        "status": tt.status.value if hasattr(tt.status, "value") else str(tt.status),
        "solver_status": tt.solver_status,
        "objective_score": tt.objective_score,
        "solver_time_seconds": tt.solver_time_seconds,
        "total_entries": len(tt.entries),
        "bottlenecks": tt.bottlenecks,
        "possible_actions": tt.possible_actions
    }


@router.get("")
def list_timetables(db: Session = Depends(get_db)):
    tts = db.query(Timetable).order_by(Timetable.created_at.desc()).all()
    return [
        {
            "id": tt.id,
            "name": tt.name,
            "academic_term": tt.academic_term,
            "status": tt.status.value if hasattr(tt.status, "value") else str(tt.status),
            "solver_status": tt.solver_status,
            "objective_score": tt.objective_score,
            "solver_time_seconds": tt.solver_time_seconds,
            "is_published": tt.is_published,
            "created_at": tt.created_at
        }
        for tt in tts
    ]


@router.get("/{timetable_id}")
def get_timetable(timetable_id: str, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    entries = []
    for e in tt.entries:
        entries.append({
            "id": e.id,
            "session_id": e.session_id,
            "course_id": e.course_id,
            "course_code": e.course.course_code if e.course else "",
            "course_name": e.course.course_name if e.course else "",
            "section_id": e.section_id,
            "section_name": e.section.name if e.section else "",
            "faculty_id": e.faculty_id,
            "faculty_name": e.faculty.name if e.faculty else "",
            "room_id": e.room_id,
            "room_name": f"R{e.room.room_number} ({e.room.building})" if e.room else "",
            "day_index": e.day_index,
            "period_index": e.period_index,
            "duration": e.duration,
            "is_locked": e.is_locked
        })

    return {
        "id": tt.id,
        "name": tt.name,
        "academic_term": tt.academic_term,
        "status": tt.status.value if hasattr(tt.status, "value") else str(tt.status),
        "solver_status": tt.solver_status,
        "objective_score": tt.objective_score,
        "solver_time_seconds": tt.solver_time_seconds,
        "stats": tt.stats,
        "bottlenecks": tt.bottlenecks,
        "possible_actions": tt.possible_actions,
        "is_published": tt.is_published,
        "entries": entries
    }


@router.post("/{timetable_id}/validate")
def validate_timetable(timetable_id: str, db: Session = Depends(get_db)):
    svc = TimetableService(db)
    val_res = svc.validate_timetable(timetable_id)
    return {
        "is_valid": val_res.is_valid,
        "total_conflicts": val_res.total_conflicts,
        "errors": [e.__dict__ for e in val_res.errors],
        "warnings": val_res.warnings
    }


@router.post("/{timetable_id}/manual-edit")
def manual_edit_entry(timetable_id: str, req: ManualEditEntryRequest, db: Session = Depends(get_db)):
    svc = TimetableService(db)
    return svc.manual_edit_entry(
        timetable_id=timetable_id,
        entry_id=req.entry_id,
        new_day=req.new_day_index,
        new_period=req.new_period_index,
        new_room_id=req.new_room_id
    )


@router.post("/{timetable_id}/repair")
def repair_timetable(timetable_id: str, req: RepairRequest, db: Session = Depends(get_db)):
    svc = TimetableService(db)
    return svc.repair_timetable(
        timetable_id=timetable_id,
        broken_faculty_id=req.broken_faculty_id,
        broken_room_id=req.broken_room_id,
        broken_day=req.broken_day,
        broken_period=req.broken_period
    )


@router.post("/{timetable_id}/simulate")
def simulate_what_if(timetable_id: str, req: WhatIfRequest, db: Session = Depends(get_db)):
    svc = TimetableService(db)
    return svc.run_what_if_simulation(timetable_id, req.dict())


@router.post("/{timetable_id}/publish")
def publish_timetable(timetable_id: str, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")
    tt.is_published = True
    tt.status = "PUBLISHED"
    db.commit()
    return {"message": f"Timetable '{tt.name}' published successfully."}
