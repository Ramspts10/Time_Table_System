"""
Export API Endpoints for CSV, JSON, Excel downloads.
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.export_service import ExportService

router = APIRouter()


@router.get("/{timetable_id}/csv")
def export_timetable_csv(timetable_id: str, db: Session = Depends(get_db)):
    svc = ExportService(db)
    csv_data = svc.export_csv(timetable_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=timetable_{timetable_id}.csv"}
    )


@router.get("/{timetable_id}/json")
def export_timetable_json(timetable_id: str, db: Session = Depends(get_db)):
    svc = ExportService(db)
    json_data = svc.export_json(timetable_id)
    return Response(
        content=json_data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=timetable_{timetable_id}.json"}
    )


@router.get("/{timetable_id}/excel")
def export_timetable_excel(timetable_id: str, db: Session = Depends(get_db)):
    svc = ExportService(db)
    xlsx_bytes = svc.export_excel(timetable_id)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=timetable_{timetable_id}.xlsx"}
    )
