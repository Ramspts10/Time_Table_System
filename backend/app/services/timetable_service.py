"""
Timetable Business Service - Interfacing Database and Optimizer Engine.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import copy

from backend.app.models.models import (
    Institution, Department, Faculty, Course, Section, Room,
    PeriodConfig, ConstraintRule, Timetable, TimetableEntry, TimetableStatus, AuditLog
)
from optimizer.variables import (
    SchedulingProblemData, PeriodConfigData, RoomData, FacultyData,
    SectionData, SessionToSchedule, ConstraintWeights
)
from optimizer.solver import TimetableSolver, SolverResult
from optimizer.validator import TimetableValidator, ValidationResult
from optimizer.repair import TimetableRepairEngine, WhatIfScenario


class TimetableService:
    def __init__(self, db: Session):
        self.db = db
        self.validator = TimetableValidator()
        self.repair_engine = TimetableRepairEngine()

    def _build_problem_data(self, institution_id: str) -> SchedulingProblemData:
        # Load period config
        period_cfg_obj = self.db.query(PeriodConfig).filter(PeriodConfig.institution_id == institution_id).first()
        if not period_cfg_obj:
            period_cfg_data = PeriodConfigData(days=["MON", "TUE", "WED", "THU", "FRI"], periods_per_day=8, break_periods=[3])
        else:
            period_cfg_data = PeriodConfigData(
                days=period_cfg_obj.days or ["MON", "TUE", "WED", "THU", "FRI"],
                periods_per_day=period_cfg_obj.periods_per_day or 8,
                break_periods=period_cfg_obj.break_periods or [3]
            )

        # Load constraint weights
        rule_obj = self.db.query(ConstraintRule).filter(ConstraintRule.institution_id == institution_id).first()
        weights = ConstraintWeights(
            faculty_gaps=rule_obj.faculty_gaps_weight if rule_obj else 10,
            student_gaps=rule_obj.student_gaps_weight if rule_obj else 10,
            room_capacity_waste=rule_obj.room_capacity_waste_weight if rule_obj else 2,
            room_changes=rule_obj.room_changes_weight if rule_obj else 5,
            undesirable_periods=rule_obj.undesirable_periods_weight if rule_obj else 4,
            preference_violations=rule_obj.preference_violations_weight if rule_obj else 8,
            workload_imbalance=rule_obj.workload_imbalance_weight if rule_obj else 6,
        )

        # Load rooms
        rooms_db = self.db.query(Room).all()
        rooms_data = [
            RoomData(
                id=r.id,
                name=f"R{r.room_number} ({r.building})",
                building=r.building,
                capacity=r.capacity,
                room_type=r.room_type,
                equipment=r.equipment or [],
                available_days=r.available_days or [],
                unavailable_slots={(s["day"], s["period"]) for s in (r.unavailable_slots or [])}
            )
            for r in rooms_db
        ]

        # Load faculty
        fac_db = self.db.query(Faculty).all()
        fac_data = [
            FacultyData(
                id=f.id,
                name=f.name,
                department_id=f.department_id,
                max_hours_per_day=f.max_hours_per_day,
                max_hours_per_week=f.max_hours_per_week,
                available_days=f.available_days or [],
                unavailable_slots={(s["day"], s["period"]) for s in (f.unavailable_slots or [])},
                preferred_periods=f.preferred_periods or [],
                preferred_rooms=f.preferred_rooms or []
            )
            for f in fac_db
        ]

        # Load sections
        sec_db = self.db.query(Section).all()
        sec_data = [
            SectionData(
                id=s.id,
                name=s.name,
                program=s.program,
                semester=s.semester,
                student_count=s.student_count
            )
            for s in sec_db
        ]

        # Generate sessions mapping courses to sections & faculty
        courses_db = self.db.query(Course).all()
        sessions_data: List[SessionToSchedule] = []

        for sec in sec_db:
            # Match courses belonging to section's department and semester
            matched_courses = [c for c in courses_db if c.department_id == sec.department_id and c.semester == sec.semester]
            if not matched_courses:
                matched_courses = [c for c in courses_db if c.department_id == sec.department_id]

            dept_faculties = [f for f in fac_db if f.department_id == sec.department_id]
            if not dept_faculties:
                dept_faculties = fac_db

            fac_index = 0
            for course in matched_courses:
                assigned_fac = dept_faculties[fac_index % len(dept_faculties)]
                fac_index += 1


                # Calculate session instances needed
                needed_hours = course.weekly_hours
                duration = course.session_duration or 1
                num_sessions = max(1, needed_hours // duration)

                for idx in range(num_sessions):
                    sess_id = f"sess_{sec.id}_{course.id}_{idx+1}"
                    sessions_data.append(SessionToSchedule(
                        id=sess_id,
                        course_id=course.id,
                        course_code=course.course_code,
                        course_name=course.course_name,
                        section_id=sec.id,
                        faculty_id=assigned_fac.id,
                        duration=duration,
                        requires_lab=course.requires_lab,
                        required_room_type=course.required_room_type,
                        required_equipment=course.required_equipment or [],
                        preferred_periods=course.preferred_periods or [],
                        preferred_days=course.preferred_days or []
                    ))

        return SchedulingProblemData(
            institution_id=institution_id,
            period_config=period_cfg_data,
            rooms=rooms_data,
            faculty=fac_data,
            sections=sec_data,
            sessions=sessions_data,
            weights=weights
        )

    def generate_timetable(self, institution_id: str, name: str, academic_term: str, time_limit_seconds: float = 30.0) -> Timetable:
        problem_data = self._build_problem_data(institution_id)
        solver = TimetableSolver(time_limit_seconds=time_limit_seconds)
        res: SolverResult = solver.solve(problem_data)

        val_res = self.validator.validate(problem_data, res.assignments)

        tt_status = TimetableStatus.GENERATED if (res.status in ("OPTIMAL", "FEASIBLE") and val_res.is_valid) else (
            TimetableStatus.INFEASIBLE if res.status == "INFEASIBLE" else TimetableStatus.FAILED
        )

        tt = Timetable(
            institution_id=institution_id,
            name=name,
            academic_term=academic_term,
            status=tt_status,
            solver_status=res.status,
            objective_score=res.objective_value,
            solver_time_seconds=res.solver_time_seconds,
            stats=res.stats,
            bottlenecks=res.bottlenecks,
            possible_actions=res.possible_actions,
            is_published=False
        )
        self.db.add(tt)
        self.db.flush()

        # Save entries
        for assign in res.assignments:
            entry = TimetableEntry(
                timetable_id=tt.id,
                session_id=assign.session_id,
                course_id=assign.course_id,
                section_id=assign.section_id,
                faculty_id=assign.faculty_id,
                room_id=assign.room_id,
                day_index=assign.day_index,
                period_index=assign.period_index,
                duration=assign.duration,
                is_locked=assign.is_locked
            )
            self.db.add(entry)

        # Audit log
        log = AuditLog(
            action="GENERATE_TIMETABLE",
            entity_type="Timetable",
            entity_id=tt.id,
            details={"solver_status": res.status, "scheduled_sessions": len(res.assignments)}
        )
        self.db.add(log)

        self.db.commit()
        self.db.refresh(tt)
        return tt

    def validate_timetable(self, timetable_id: str) -> ValidationResult:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        problem_data = self._build_problem_data(tt.institution_id)
        assignments = [
            {
                "session_id": e.session_id,
                "course_id": e.course_id,
                "course_code": e.course.course_code if e.course else "",
                "section_id": e.section_id,
                "faculty_id": e.faculty_id,
                "room_id": e.room_id,
                "day_index": e.day_index,
                "period_index": e.period_index,
                "duration": e.duration
            }
            for e in tt.entries
        ]
        return self.validator.validate(problem_data, assignments)

    def manual_edit_entry(self, timetable_id: str, entry_id: str, new_day: int, new_period: int, new_room_id: str) -> Dict[str, Any]:
        entry = self.db.query(TimetableEntry).filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.id == entry_id
        ).first()
        if not entry:
            raise ValueError("Entry not found")

        tt = entry.timetable
        problem_data = self._build_problem_data(tt.institution_id)

        # Clone current assignments and apply prospective edit
        assignments = []
        for e in tt.entries:
            if e.id == entry_id:
                assignments.append({
                    "session_id": e.session_id,
                    "course_id": e.course_id,
                    "course_code": e.course.course_code if e.course else "",
                    "section_id": e.section_id,
                    "faculty_id": e.faculty_id,
                    "room_id": new_room_id,
                    "day_index": new_day,
                    "period_index": new_period,
                    "duration": e.duration
                })
            else:
                assignments.append({
                    "session_id": e.session_id,
                    "course_id": e.course_id,
                    "course_code": e.course.course_code if e.course else "",
                    "section_id": e.section_id,
                    "faculty_id": e.faculty_id,
                    "room_id": e.room_id,
                    "day_index": e.day_index,
                    "period_index": e.period_index,
                    "duration": e.duration
                })

        val_res = self.validator.validate(problem_data, assignments)
        if not val_res.is_valid:
            return {
                "success": False,
                "message": "Manual edit failed validation constraints.",
                "conflicts": [e.__dict__ for e in val_res.errors]
            }

        # Apply edit
        entry.day_index = new_day
        entry.period_index = new_period
        entry.room_id = new_room_id
        self.db.commit()

        return {
            "success": True,
            "message": "Manual edit applied successfully.",
            "conflicts": []
        }

    def repair_timetable(self, timetable_id: str, broken_faculty_id: Optional[str] = None, broken_room_id: Optional[str] = None, broken_day: Optional[int] = None, broken_period: Optional[int] = None) -> Dict[str, Any]:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        problem_data = self._build_problem_data(tt.institution_id)
        current_assignments = [
            {
                "session_id": e.session_id,
                "course_id": e.course_id,
                "course_code": e.course.course_code if e.course else "",
                "course_name": e.course.course_name if e.course else "",
                "section_id": e.section_id,
                "faculty_id": e.faculty_id,
                "room_id": e.room_id,
                "day_index": e.day_index,
                "period_index": e.period_index,
                "duration": e.duration,
                "is_locked": e.is_locked
            }
            for e in tt.entries
        ]

        repair_res = self.repair_engine.repair_disruption(
            problem_data,
            current_assignments,
            broken_faculty_id=broken_faculty_id,
            broken_room_id=broken_room_id,
            broken_day=broken_day,
            broken_period=broken_period
        )

        if repair_res.repaired:
            # Update database entries
            for new_assign in repair_res.assignments:
                db_entry = self.db.query(TimetableEntry).filter(
                    TimetableEntry.timetable_id == tt.id,
                    TimetableEntry.session_id == new_assign.session_id
                ).first()
                if db_entry:
                    db_entry.day_index = new_assign.day_index
                    db_entry.period_index = new_assign.period_index
                    db_entry.room_id = new_assign.room_id
            self.db.commit()

        return {
            "repaired": repair_res.repaired,
            "status": repair_res.status,
            "affected_sessions": repair_res.num_affected_sessions,
            "sessions_moved": repair_res.num_sessions_moved,
            "details": repair_res.moved_sessions_details,
            "conflicts": [e.__dict__ for e in repair_res.validation.errors]
        }

    def run_what_if_simulation(self, timetable_id: str, scenario_data: Dict[str, Any]) -> Dict[str, Any]:
        tt = self.db.query(Timetable).filter(Timetable.id == timetable_id).first()
        if not tt:
            raise ValueError("Timetable not found")

        problem_data = self._build_problem_data(tt.institution_id)
        current_assignments = [
            {
                "session_id": e.session_id,
                "course_id": e.course_id,
                "course_code": e.course.course_code if e.course else "",
                "course_name": e.course.course_name if e.course else "",
                "section_id": e.section_id,
                "faculty_id": e.faculty_id,
                "room_id": e.room_id,
                "day_index": e.day_index,
                "period_index": e.period_index,
                "duration": e.duration
            }
            for e in tt.entries
        ]

        scenario = WhatIfScenario(
            unavailable_room_ids=scenario_data.get("unavailable_room_ids", []),
            unavailable_faculty_slots=scenario_data.get("unavailable_faculty_slots", []),
            section_capacity_changes=scenario_data.get("section_capacity_changes", {})
        )

        return self.repair_engine.simulate_what_if(problem_data, current_assignments, scenario)
