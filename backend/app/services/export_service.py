"""
Export Service for CSV, Excel, JSON, and PDF Timetable Reports.
"""
import csv
import io
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from openpyxl import Workbook
from backend.app.models.models import Timetable, TimetableEntry, PeriodConfig


class ExportService:
    def __init__(self, db: Session):
        self.db = db

    def export_csv(self, timetable_id: str) -> str:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Course Code", "Course Name", "Section", "Faculty", "Room", "Day Index", "Period Index", "Duration"])

        for e in tt.entries:
            writer.writerow([
                e.course.course_code if e.course else "",
                e.course.course_name if e.course else "",
                e.section.name if e.section else "",
                e.faculty.name if e.faculty else "",
                f"{e.room.room_number} ({e.room.building})" if e.room else "",
                e.day_index,
                e.period_index,
                e.duration
            ])

        return output.getvalue()

    def export_json(self, timetable_id: str) -> str:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        entries_data = [
            {
                "session_id": e.session_id,
                "course_code": e.course.course_code if e.course else "",
                "course_name": e.course.course_name if e.course else "",
                "section": e.section.name if e.section else "",
                "faculty": e.faculty.name if e.faculty else "",
                "room": e.room.room_number if e.room else "",
                "day_index": e.day_index,
                "period_index": e.period_index,
                "duration": e.duration,
                "is_locked": e.is_locked
            }
            for e in tt.entries
        ]

        payload = {
            "timetable_id": tt.id,
            "name": tt.name,
            "academic_term": tt.academic_term,
            "status": tt.status.value if hasattr(tt.status, "value") else str(tt.status),
            "solver_status": tt.solver_status,
            "entries": entries_data
        }
        return json.dumps(payload, indent=2)

    def export_excel(self, timetable_id: str) -> bytes:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        wb = Workbook()
        ws = wb.active
        ws.title = "Schedule"

        ws.append(["Course Code", "Course Name", "Section", "Faculty", "Room", "Day Index", "Period Index", "Duration"])
        for e in tt.entries:
            ws.append([
                e.course.course_code if e.course else "",
                e.course.course_name if e.course else "",
                e.section.name if e.section else "",
                e.faculty.name if e.faculty else "",
                f"{e.room.room_number} ({e.room.building})" if e.room else "",
                e.day_index,
                e.period_index,
                e.duration
            ])

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()
