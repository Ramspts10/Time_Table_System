"""
Independent Timetable Validator and Conflict Explainer Engine.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
from optimizer.variables import SchedulingProblemData


@dataclass
class ConflictDetail:
    code: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationResult:
    is_valid: bool
    total_conflicts: int
    errors: List[ConflictDetail] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class TimetableValidator:
    """
    Independent validator for any timetable schedule (generated or manually edited).
    Must not assume solver correctness.
    """
    def validate(self, problem: SchedulingProblemData, assignments: List[Any]) -> ValidationResult:
        errors: List[ConflictDetail] = []
        warnings: List[str] = []

        # Index maps
        rooms_by_id = {r.id: r for r in problem.rooms}
        faculty_by_id = {f.id: f for f in problem.faculty}
        sections_by_id = {s.id: s for s in problem.sections}
        sessions_by_id = {s.id: s for s in problem.sessions}

        # Track occupied slots: (day, period) -> list of assignments
        fac_occupancy: Dict[Tuple[str, int, int], List[Any]] = {}
        sec_occupancy: Dict[Tuple[str, int, int], List[Any]] = {}
        room_occupancy: Dict[Tuple[str, int, int], List[Any]] = {}

        scheduled_session_ids: Set[str] = set()

        for assign in assignments:
            sess_id = getattr(assign, "session_id", None) or assign.get("session_id")
            room_id = getattr(assign, "room_id", None) or assign.get("room_id")
            day_idx = getattr(assign, "day_index", None) if hasattr(assign, "day_index") else assign.get("day_index")
            period_idx = getattr(assign, "period_index", None) if hasattr(assign, "period_index") else assign.get("period_index")
            duration = getattr(assign, "duration", 1) or assign.get("duration", 1)

            scheduled_session_ids.add(sess_id)
            sess = sessions_by_id.get(sess_id)
            if not sess:
                errors.append(ConflictDetail(
                    code="UNKNOWN_SESSION",
                    message=f"Assignment references unknown session ID '{sess_id}'.",
                    details={"session_id": sess_id}
                ))
                continue

            room = rooms_by_id.get(room_id)
            faculty = faculty_by_id.get(sess.faculty_id)
            section = sections_by_id.get(sess.section_id)

            # 1. PERIOD & DAY BOUNDS CHECK
            if day_idx < 0 or day_idx >= len(problem.period_config.days):
                errors.append(ConflictDetail(
                    code="INVALID_DAY",
                    message=f"Session '{sess.course_code}' assigned to invalid day index {day_idx}.",
                    details={"session_id": sess.id, "day_index": day_idx}
                ))
            if period_idx < 0 or period_idx + duration > problem.period_config.periods_per_day:
                errors.append(ConflictDetail(
                    code="INVALID_PERIOD",
                    message=f"Session '{sess.course_code}' (duration {duration}) exceeds daily period limit at period {period_idx}.",
                    details={"session_id": sess.id, "period_index": period_idx, "duration": duration}
                ))

            # 2. BREAK PERIOD CHECK
            for p in range(period_idx, period_idx + duration):
                if p in problem.period_config.break_periods:
                    errors.append(ConflictDetail(
                        code="BREAK_PERIOD_COLLISION",
                        message=f"Session '{sess.course_code}' overlaps break/lunch period {p}.",
                        details={"session_id": sess.id, "period": p}
                    ))

            # 3. CAPACITY CHECK
            if room and section and room.capacity < section.student_count:
                errors.append(ConflictDetail(
                    code="ROOM_CAPACITY_EXCEEDED",
                    message=f"Room {room.name} (cap {room.capacity}) cannot accommodate section {section.name} ({section.student_count} students).",
                    details={"room": room.name, "capacity": room.capacity, "students": section.student_count, "session": sess.course_code}
                ))

            # 4. ROOM TYPE CHECK
            if room and sess.requires_lab and "LAB" not in room.room_type.upper():
                errors.append(ConflictDetail(
                    code="ROOM_TYPE_MISMATCH",
                    message=f"Course '{sess.course_code}' requires a laboratory, but room {room.name} is a {room.room_type}.",
                    details={"room": room.name, "room_type": room.room_type, "required": "LAB"}
                ))

            # 5. EQUIPMENT CHECK
            if room and sess.required_equipment:
                missing = [eq for eq in sess.required_equipment if eq not in room.equipment]
                if missing:
                    errors.append(ConflictDetail(
                        code="EQUIPMENT_MISSING",
                        message=f"Room {room.name} lacks required equipment {missing} for course '{sess.course_code}'.",
                        details={"room": room.name, "missing_equipment": missing}
                    ))

            # 6. FACULTY AVAILABILITY CHECK
            if faculty:
                for p in range(period_idx, period_idx + duration):
                    if (day_idx, p) in faculty.unavailable_slots:
                        errors.append(ConflictDetail(
                            code="FACULTY_UNAVAILABLE",
                            message=f"Faculty {faculty.name} is unavailable on day {day_idx}, period {p}.",
                            details={"faculty": faculty.name, "day": day_idx, "period": p}
                        ))

            # 7. ROOM AVAILABILITY CHECK
            if room:
                for p in range(period_idx, period_idx + duration):
                    if (day_idx, p) in room.unavailable_slots:
                        errors.append(ConflictDetail(
                            code="ROOM_UNAVAILABLE",
                            message=f"Room {room.name} is unavailable on day {day_idx}, period {p}.",
                            details={"room": room.name, "day": day_idx, "period": p}
                        ))

            # Occupancy tracking for collision detection
            for p in range(period_idx, period_idx + duration):
                if faculty:
                    key = (faculty.id, day_idx, p)
                    fac_occupancy.setdefault(key, []).append(sess)
                if section:
                    key = (section.id, day_idx, p)
                    sec_occupancy.setdefault(key, []).append(sess)
                if room:
                    key = (room.id, day_idx, p)
                    room_occupancy.setdefault(key, []).append(sess)

        # 8. FACULTY DOUBLE-BOOKING CHECK
        for (fac_id, day, period), sess_list in fac_occupancy.items():
            if len(sess_list) > 1:
                fac_name = faculty_by_id[fac_id].name if fac_id in faculty_by_id else fac_id
                courses = [s.course_code for s in sess_list]
                errors.append(ConflictDetail(
                    code="FACULTY_COLLISION",
                    message=f"Faculty {fac_name} double-booked at day {day}, period {period} for courses: {', '.join(courses)}.",
                    details={"faculty": fac_name, "day": day, "period": period, "courses": courses}
                ))

        # 9. SECTION DOUBLE-BOOKING CHECK
        for (sec_id, day, period), sess_list in sec_occupancy.items():
            if len(sess_list) > 1:
                sec_name = sections_by_id[sec_id].name if sec_id in sections_by_id else sec_id
                courses = [s.course_code for s in sess_list]
                errors.append(ConflictDetail(
                    code="SECTION_COLLISION",
                    message=f"Section {sec_name} double-booked at day {day}, period {period} for courses: {', '.join(courses)}.",
                    details={"section": sec_name, "day": day, "period": period, "courses": courses}
                ))

        # 10. ROOM DOUBLE-BOOKING CHECK
        for (room_id, day, period), sess_list in room_occupancy.items():
            if len(sess_list) > 1:
                r_name = rooms_by_id[room_id].name if room_id in rooms_by_id else room_id
                courses = [s.course_code for s in sess_list]
                errors.append(ConflictDetail(
                    code="ROOM_COLLISION",
                    message=f"Room {r_name} double-booked at day {day}, period {period} for courses: {', '.join(courses)}.",
                    details={"room": r_name, "day": day, "period": period, "courses": courses}
                ))

        # 11. UNMATCHED SESSIONS CHECK
        unsscheduled = [s for s in problem.sessions if s.id not in scheduled_session_ids]
        if unsscheduled:
            for uns in unsscheduled:
                errors.append(ConflictDetail(
                    code="UNSCHEDULED_SESSION",
                    message=f"Session '{uns.course_code}' for section '{uns.section_id}' was not scheduled.",
                    details={"session_id": uns.id, "course": uns.course_code}
                ))

        return ValidationResult(
            is_valid=len(errors) == 0,
            total_conflicts=len(errors),
            errors=errors,
            warnings=warnings
        )
