"""
Automatic Timetable Repair, What-If Simulation, and Ripple Shift Override Engine.
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
    unavailable_faculty_slots: List[Dict[str, Any]] = field(default_factory=list)
    removed_period_indices: List[int] = field(default_factory=list)
    added_room: Optional[RoomData] = None
    section_capacity_changes: Dict[str, int] = field(default_factory=dict)


@dataclass
class RippleProposal:
    can_override: bool
    conflict_detected: bool
    conflicting_session: Optional[Dict[str, Any]]
    recommended_shifts: List[Dict[str, Any]]  # List of proposed moves [{"session_id": "...", "course_code": "...", "from": {...}, "to": {...}}]
    proposed_assignments: List[ScheduledSessionAssignment]
    validation: ValidationResult


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

        cloned_sessions = []
        for sess in problem.sessions:
            c_sess = copy.deepcopy(sess)
            existing_assign = next((a for a in current_assignments if a.session_id == sess.id), None)

            if c_sess.id not in affected_session_ids and existing_assign:
                c_sess.is_locked = True
                c_sess.locked_day = existing_assign.day_index
                c_sess.locked_period = existing_assign.period_index
                c_sess.locked_room_id = existing_assign.room_id
            else:
                c_sess.is_locked = False
                c_sess.locked_day = None
                c_sess.locked_period = None
                c_sess.locked_room_id = None
            cloned_sessions.append(c_sess)

        repaired_problem = copy.deepcopy(problem)
        repaired_problem.sessions = cloned_sessions

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

    def propose_ripple_shift(
        self,
        problem: SchedulingProblemData,
        current_assignments: List[ScheduledSessionAssignment],
        target_session_id: str,
        target_day: int,
        target_period: int,
        target_room_id: str
    ) -> RippleProposal:
        """
        When placing target_session into (target_day, target_period, target_room_id) causes a conflict
        with existing session C, lock target_session into that slot, unfix session C, and run CP-SAT to
        recommend shifting session C to the next optimal free slot E.
        """
        # Find session currently occupying target slot or experiencing collision
        conflicting_assign = next(
            (a for a in current_assignments if a.session_id != target_session_id and a.day_index == target_day and a.period_index == target_period and a.room_id == target_room_id),
            None
        )
        if not conflicting_assign:
            # Check for section or faculty collision at target slot
            target_sess = next((s for s in problem.sessions if s.id == target_session_id), None)
            if target_sess:
                conflicting_assign = next(
                    (a for a in current_assignments if a.session_id != target_session_id and a.day_index == target_day and a.period_index == target_period and (a.faculty_id == target_sess.faculty_id or a.section_id == target_sess.section_id)),
                    None
                )

        conflicting_info = None
        if conflicting_assign:
            conflicting_info = {
                "session_id": conflicting_assign.session_id,
                "course_code": conflicting_assign.course_code,
                "course_name": conflicting_assign.course_name,
                "section_id": conflicting_assign.section_id,
                "faculty_id": conflicting_assign.faculty_id,
                "room_id": conflicting_assign.room_id,
                "day_index": conflicting_assign.day_index,
                "period_index": conflicting_assign.period_index
            }

        # Build ripple optimization problem
        ripple_problem = copy.deepcopy(problem)
        unfixed_session_ids = {target_session_id}
        if conflicting_assign:
            unfixed_session_ids.add(conflicting_assign.session_id)

        cloned_sessions = []
        for sess in ripple_problem.sessions:
            c_sess = copy.deepcopy(sess)
            if c_sess.id == target_session_id:
                c_sess.is_locked = True
                c_sess.locked_day = target_day
                c_sess.locked_period = target_period
                c_sess.locked_room_id = target_room_id
            elif c_sess.id in unfixed_session_ids:
                c_sess.is_locked = False
                c_sess.locked_day = None
                c_sess.locked_period = None
                c_sess.locked_room_id = None
            else:
                existing_assign = next((a for a in current_assignments if a.session_id == c_sess.id), None)
                if existing_assign:
                    c_sess.is_locked = True
                    c_sess.locked_day = existing_assign.day_index
                    c_sess.locked_period = existing_assign.period_index
                    c_sess.locked_room_id = existing_assign.room_id
            cloned_sessions.append(c_sess)

        ripple_problem.sessions = cloned_sessions

        solver_res = self.solver.solve(ripple_problem)
        val_res = self.validator.validate(ripple_problem, solver_res.assignments)

        recommended_shifts = []
        if solver_res.status in ("OPTIMAL", "FEASIBLE") and val_res.is_valid:
            for new_a in solver_res.assignments:
                orig = next((a for a in current_assignments if a.session_id == new_a.session_id), None)
                if orig and (orig.day_index != new_a.day_index or orig.period_index != new_a.period_index or orig.room_id != new_a.room_id):
                    recommended_shifts.append({
                        "session_id": new_a.session_id,
                        "course_code": new_a.course_code,
                        "course_name": new_a.course_name,
                        "from": {"day_index": orig.day_index, "period_index": orig.period_index, "room_id": orig.room_id},
                        "to": {"day_index": new_a.day_index, "period_index": new_a.period_index, "room_id": new_a.room_id}
                    })

        return RippleProposal(
            can_override=val_res.is_valid and solver_res.status in ("OPTIMAL", "FEASIBLE"),
            conflict_detected=conflicting_assign is not None,
            conflicting_session=conflicting_info,
            recommended_shifts=recommended_shifts,
            proposed_assignments=solver_res.assignments,
            validation=val_res
        )

    def simulate_what_if(
        self,
        problem: SchedulingProblemData,
        current_assignments: List[ScheduledSessionAssignment],
        scenario: WhatIfScenario
    ) -> Dict[str, Any]:
        sim_problem = copy.deepcopy(problem)

        if scenario.unavailable_room_ids:
            for r in sim_problem.rooms:
                if r.id in scenario.unavailable_room_ids:
                    for d in range(len(sim_problem.period_config.days)):
                        for p in range(sim_problem.period_config.periods_per_day):
                            r.unavailable_slots.add((d, p))

        if scenario.unavailable_faculty_slots:
            for slot_info in scenario.unavailable_faculty_slots:
                fac_id = slot_info.get("faculty_id")
                d = slot_info.get("day")
                p = slot_info.get("period")
                fac = next((f for f in sim_problem.faculty if f.id == fac_id), None)
                if fac and d is not None and p is not None:
                    fac.unavailable_slots.add((d, p))

        if scenario.section_capacity_changes:
            for sec in sim_problem.sections:
                if sec.id in scenario.section_capacity_changes:
                    sec.student_count = scenario.section_capacity_changes[sec.id]

        if scenario.added_room:
            sim_problem.rooms.append(scenario.added_room)

        solver_res = self.solver.solve(sim_problem)
        val_res = self.validator.validate(sim_problem, solver_res.assignments)

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
