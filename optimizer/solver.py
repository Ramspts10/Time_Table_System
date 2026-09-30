"""
CP-SAT Timetable Solver Orchestrator.
"""
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model
from optimizer.variables import SchedulingProblemData, OptimizationVariables
from optimizer.hard_constraints import apply_hard_constraints
from optimizer.objective import setup_objective


@dataclass
class ScheduledSessionAssignment:
    session_id: str
    course_id: str
    course_code: str
    course_name: str
    section_id: str
    faculty_id: str
    room_id: str
    day_index: int
    period_index: int
    duration: int
    is_locked: bool = False


@dataclass
class SolverResult:
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, MODEL_INVALID, UNKNOWN
    solver_time_seconds: float
    objective_value: float
    num_variables: int
    num_constraints: int
    num_sessions: int
    assignments: List[ScheduledSessionAssignment] = field(default_factory=list)
    stats: Dict[str, Any] = field(default_factory=dict)
    bottlenecks: List[str] = field(default_factory=list)
    possible_actions: List[str] = field(default_factory=list)


class TimetableSolver:
    def __init__(self, time_limit_seconds: float = 30.0):
        self.time_limit_seconds = time_limit_seconds

    def solve(self, problem: SchedulingProblemData) -> SolverResult:
        start_time = time.time()
        model = cp_model.CpModel()

        # 1. Create Decision Variables
        vars_ctx = OptimizationVariables(model, problem)

        # 2. Apply Hard Constraints
        apply_hard_constraints(model, vars_ctx, problem)

        # 3. Setup Objective
        setup_objective(model, vars_ctx, problem)

        # 4. Configure Solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit_seconds
        solver.parameters.num_search_workers = 0  # Use all available CPU cores for maximum parallel search speed


        # 5. Solve
        status_code = solver.Solve(model)
        elapsed = time.time() - start_time

        status_str_map = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN"
        }
        status_str = status_str_map.get(status_code, "UNKNOWN")

        assignments: List[ScheduledSessionAssignment] = []
        obj_val = 0.0

        if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            obj_val = solver.ObjectiveValue()
            for (sess_id, day, period, room_id), var in vars_ctx.x.items():
                if solver.Value(var) == 1:
                    sess = next((s for s in problem.sessions if s.id == sess_id), None)
                    if sess:
                        assignments.append(ScheduledSessionAssignment(
                            session_id=sess.id,
                            course_id=sess.course_id,
                            course_code=sess.course_code,
                            course_name=sess.course_name,
                            section_id=sess.section_id,
                            faculty_id=sess.faculty_id,
                            room_id=room_id,
                            day_index=day,
                            period_index=period,
                            duration=sess.duration,
                            is_locked=sess.is_locked
                        ))

        # Calculate metrics
        num_vars = len(vars_ctx.x)
        num_consts = len(model.Proto().constraints)

        # Room utilization stats
        total_slots = len(problem.period_config.days) * problem.period_config.periods_per_day
        room_usage = {}
        for room in problem.rooms:
            used_slots = sum(a.duration for a in assignments if a.room_id == room.id)
            room_usage[room.name] = round(used_slots / total_slots, 2) if total_slots > 0 else 0

        avg_room_utilization = round(sum(room_usage.values()) / len(room_usage), 2) if room_usage else 0.0

        stats = {
            "total_sessions": len(problem.sessions),
            "total_scheduled": len(assignments),
            "room_utilization_rate": avg_room_utilization,
            "room_utilization_by_room": room_usage,
            "solver_wall_time": round(elapsed, 3),
            "branches": solver.NumBranches(),
            "conflicts": solver.NumConflicts()
        }

        bottlenecks = []
        possible_actions = []

        if status_code == cp_model.INFEASIBLE:
            # Diagnose bottlenecks
            lab_sessions = [s for s in problem.sessions if s.requires_lab]
            lab_rooms = [r for r in problem.rooms if "LAB" in r.room_type.upper()]
            total_lab_hours_needed = sum(s.duration for s in lab_sessions)
            total_lab_hours_available = len(lab_rooms) * total_slots

            if total_lab_hours_needed > total_lab_hours_available:
                bottlenecks.append(f"Lab hours required ({total_lab_hours_needed}h) exceed total available lab capacity ({total_lab_hours_available}h).")
                possible_actions.append("Add another compatible laboratory or increase lab working periods.")

            # Check capacity bottlenecks
            max_sec_size = max((sec.student_count for sec in problem.sections), default=0)
            max_room_cap = max((r.capacity for r in problem.rooms), default=0)
            if max_sec_size > max_room_cap:
                bottlenecks.append(f"Section with {max_sec_size} students exists but maximum room capacity is only {max_room_cap}.")
                possible_actions.append(f"Upgrade room capacity to at least {max_sec_size} or split the section.")

            if not bottlenecks:
                bottlenecks.append("Over-constrained faculty availability or room equipment combinations.")
                possible_actions.append("Relax faculty unavailable period constraints or enable multi-room assignment.")

        return SolverResult(
            status=status_str,
            solver_time_seconds=round(elapsed, 3),
            objective_value=round(obj_val, 2),
            num_variables=num_vars,
            num_constraints=num_consts,
            num_sessions=len(problem.sessions),
            assignments=assignments,
            stats=stats,
            bottlenecks=bottlenecks,
            possible_actions=possible_actions
        )
