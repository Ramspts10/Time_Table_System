"""
Automatic Timetable Repair and What-If Simulation Engine.
"""
import copy
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
from optimizer.variables import SchedulingProblemData, SessionToSchedule, RoomData, FacultyData
from optimizer.solver import TimetableSolver, SolverResult, ScheduledSessionAssignment
from optimizer.validator import TimetableValidator, ValidationResult


@dataclass
class RepairResult:
    status: str
    repaired: bool
    num_affected_sessions: int
    num_sessions_moved: int
    assignments: List[ScheduledSessionAssignment]
    moved_sessions_details: List[Dict[str, Any]]
    validation: ValidationResult


@dataclass
class WhatIfScenario:
    unavailable_room_ids: List[str] = field(default_factory=list)
    unavailable_faculty_slots: List[Dict[str, Any]] = field(default_factory=list)  # [{"faculty_id": "...", "day": 2, "period": 1}]
    removed_period_indices: List[int] = field(default_factory=list)
    added_room: Optional[RoomData] = None
    section_capacity_changes: Dict[str, int] = field(default_factory=dict)  # section_id -> new_student_count


class TimetableRepairEngine:
    def __init__(self, time_limit_seconds: float = 20.0):
        self.solver = TimetableSolver(time_limit_seconds=time_limit_seconds)
        self.validator = TimetableValidator()

    def repair_disruption(
        self,
        problem: SchedulingProblemData,
        current_assignments: List[ScheduledSessionAssignment],
        broken_faculty_id: Optional[str] = None,
        broken_room_id: Optional[str] = None,
        broken_day: Optional[int] = None,
        broken_period: Optional[int] = None
    ) -> RepairResult:
        """
        Locks unaffected sessions, unlocks affected sessions, and performs localized re-optimization.
        """
        # Identify affected sessions
        affected_session_ids: Set[str] = set()
        for assign in current_assignments:
            is_affected = False
            if broken_faculty_id and assign.faculty_id == broken_faculty_id:
                if broken_day is None or (assign.day_index == broken_day and (broken_period is None or assign.period_index == broken_period)):
                    is_affected = True
            if broken_room_id and assign.room_id == broken_room_id:
                if broken_day is None or (assign.day_index == broken_day and (broken_period is None or assign.period_index == broken_period)):
                    is_affected = True
            if is_affected:
                affected_session_ids.add(assign.session_id)

        # Clone problem sessions and configure locking
        cloned_sessions = []
        for sess in problem.sessions:
            c_sess = copy.deepcopy(sess)
            existing_assign = next((a for a in current_assignments if a.session_id == sess.id), None)

            if c_sess.id not in affected_session_ids and existing_assign:
                # Lock unaffected sessions
                c_sess.is_locked = True
                c_sess.locked_day = existing_assign.day_index
                c_sess.locked_period = existing_assign.period_index
                c_sess.locked_room_id = existing_assign.room_id
            else:
                # Unlock affected sessions
                c_sess.is_locked = False
                c_sess.locked_day = None
                c_sess.locked_period = None
                c_sess.locked_room_id = None
            cloned_sessions.append(c_sess)

        repaired_problem = copy.deepcopy(problem)
        repaired_problem.sessions = cloned_sessions

        # Run local solver
        solver_res = self.solver.solve(repaired_problem)

        moved_details = []
        sessions_moved_count = 0

        if solver_res.status in ("OPTIMAL", "FEASIBLE"):
            for new_assign in solver_res.assignments:
                orig_assign = next((a for a in current_assignments if a.session_id == new_assign.session_id), None)
                if orig_assign and (orig_assign.day_index != new_assign.day_index or orig_assign.period_index != new_assign.period_index or orig_assign.room_id != new_assign.room_id):
                    sessions_moved_count += 1
                    moved_details.append({
                        "session_id": new_assign.session_id,
                        "course_code": new_assign.course_code,
                        "previous": {"day": orig_assign.day_index, "period": orig_assign.period_index, "room_id": orig_assign.room_id},
                        "new": {"day": new_assign.day_index, "period": new_assign.period_index, "room_id": new_assign.room_id}
                    })

        val_res = self.validator.validate(repaired_problem, solver_res.assignments)

        return RepairResult(
            status=solver_res.status,
            repaired=val_res.is_valid,
            num_affected_sessions=len(affected_session_ids),
            num_sessions_moved=sessions_moved_count,
            assignments=solver_res.assignments,
            moved_sessions_details=moved_details,
            validation=val_res
        )

    def simulate_what_if(
        self,
        problem: SchedulingProblemData,
        current_assignments: List[ScheduledSessionAssignment],
        scenario: WhatIfScenario
    ) -> Dict[str, Any]:
        """
        Runs what-if simulation without mutating database state.
        """
        sim_problem = copy.deepcopy(problem)

        # Apply room unavailabilities
        if scenario.unavailable_room_ids:
            for r in sim_problem.rooms:
                if r.id in scenario.unavailable_room_ids:
                    # Mark all slots unavailable for this room
                    for d in range(len(sim_problem.period_config.days)):
                        for p in range(sim_problem.period_config.periods_per_day):
                            r.unavailable_slots.add((d, p))

        # Apply faculty slot unavailabilities
        if scenario.unavailable_faculty_slots:
            for slot_info in scenario.unavailable_faculty_slots:
                fac_id = slot_info.get("faculty_id")
                d = slot_info.get("day")
                p = slot_info.get("period")
                fac = next((f for f in sim_problem.faculty if f.id == fac_id), None)
                if fac and d is not None and p is not None:
                    fac.unavailable_slots.add((d, p))

        # Apply section student count changes
        if scenario.section_capacity_changes:
            for sec in sim_problem.sections:
                if sec.id in scenario.section_capacity_changes:
                    sec.student_count = scenario.section_capacity_changes[sec.id]

        # Add room if provided
        if scenario.added_room:
            sim_problem.rooms.append(scenario.added_room)

        # Solve simulated problem
        solver_res = self.solver.solve(sim_problem)
        val_res = self.validator.validate(sim_problem, solver_res.assignments)

        # Compare assignments
        moved_count = 0
        room_changes_count = 0
        faculty_changes_count = 0
        affected_sessions = []

        if solver_res.status in ("OPTIMAL", "FEASIBLE"):
            for new_assign in solver_res.assignments:
                orig = next((a for a in current_assignments if a.session_id == new_assign.session_id), None)
                if orig:
                    time_changed = (orig.day_index != new_assign.day_index or orig.period_index != new_assign.period_index)
                    room_changed = (orig.room_id != new_assign.room_id)
                    fac_changed = (orig.faculty_id != new_assign.faculty_id)

                    if time_changed or room_changed or fac_changed:
                        moved_count += 1
                        if room_changed:
                            room_changes_count += 1
                        if fac_changed:
                            faculty_changes_count += 1

                        affected_sessions.append({
                            "session_id": new_assign.session_id,
                            "course_code": new_assign.course_code,
                            "previous": {"day": orig.day_index, "period": orig.period_index, "room_id": orig.room_id},
                            "new": {"day": new_assign.day_index, "period": new_assign.period_index, "room_id": new_assign.room_id}
                        })

        return {
            "feasible": val_res.is_valid and solver_res.status in ("OPTIMAL", "FEASIBLE"),
            "status": solver_res.status,
            "total_sessions": len(sim_problem.sessions),
            "sessions_moved": moved_count,
            "rooms_changed": room_changes_count,
            "faculty_changed": faculty_changes_count,
            "affected_sessions": affected_sessions,
            "new_conflicts_count": val_res.total_conflicts,
            "conflicts": [e.__dict__ for e in val_res.errors],
            "bottlenecks": solver_res.bottlenecks,
            "possible_actions": solver_res.possible_actions,
            "solver_time_seconds": solver_res.solver_time_seconds,
            "objective_value": solver_res.objective_value
        }
