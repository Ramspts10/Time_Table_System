"""
Hard Constraints enforcement for CP-SAT Solver.
"""
from typing import Dict, List, Tuple
from ortools.sat.python import cp_model
from optimizer.variables import OptimizationVariables, SchedulingProblemData


def apply_hard_constraints(model: cp_model.CpModel, vars_ctx: OptimizationVariables, problem: SchedulingProblemData):
    days_count = vars_ctx.days_count
    periods_per_day = vars_ctx.periods_per_day

    # Map sessions by faculty, section, and ID
    sessions_by_faculty: Dict[str, List] = {}
    sessions_by_section: Dict[str, List] = {}

    for sess in problem.sessions:
        sessions_by_faculty.setdefault(sess.faculty_id, []).append(sess)
        sessions_by_section.setdefault(sess.section_id, []).append(sess)

    # 1. FACULTY COLLISION: A faculty member cannot teach >1 session at any (day, period)
    for faculty in problem.faculty:
        fac_sessions = sessions_by_faculty.get(faculty.id, [])
        if len(fac_sessions) <= 1:
            continue

        for day in range(days_count):
            for period in range(periods_per_day):
                active_vars = []
                for sess in fac_sessions:
                    # Session occupies [p .. p + sess.duration - 1]
                    for start_p in range(max(0, period - sess.duration + 1), period + 1):
                        for room in problem.rooms:
                            key = (sess.id, day, start_p, room.id)
                            if key in vars_ctx.x:
                                active_vars.append(vars_ctx.x[key])
                if len(active_vars) > 1:
                    model.Add(sum(active_vars) <= 1)

    # 2. SECTION COLLISION: A section cannot attend >1 session at any (day, period)
    for section in problem.sections:
        sec_sessions = sessions_by_section.get(section.id, [])
        if len(sec_sessions) <= 1:
            continue

        for day in range(days_count):
            for period in range(periods_per_day):
                active_vars = []
                for sess in sec_sessions:
                    for start_p in range(max(0, period - sess.duration + 1), period + 1):
                        for room in problem.rooms:
                            key = (sess.id, day, start_p, room.id)
                            if key in vars_ctx.x:
                                active_vars.append(vars_ctx.x[key])
                if len(active_vars) > 1:
                    model.Add(sum(active_vars) <= 1)

    # 3. ROOM COLLISION: A room cannot host >1 session at any (day, period)
    for room in problem.rooms:
        for day in range(days_count):
            for period in range(periods_per_day):
                active_vars = []
                for sess in problem.sessions:
                    for start_p in range(max(0, period - sess.duration + 1), period + 1):
                        key = (sess.id, day, start_p, room.id)
                        if key in vars_ctx.x:
                            active_vars.append(vars_ctx.x[key])
                if len(active_vars) > 1:
                    model.Add(sum(active_vars) <= 1)

    # 4. FACULTY AVAILABILITY
    for faculty in problem.faculty:
        fac_sessions = sessions_by_faculty.get(faculty.id, [])
        for day_idx, period_idx in faculty.unavailable_slots:
            for sess in fac_sessions:
                for start_p in range(max(0, period_idx - sess.duration + 1), period_idx + 1):
                    for room in problem.rooms:
                        key = (sess.id, day_idx, start_p, room.id)
                        if key in vars_ctx.x:
                            model.Add(vars_ctx.x[key] == 0)

    # 5. ROOM AVAILABILITY
    for room in problem.rooms:
        for day_idx, period_idx in room.unavailable_slots:
            for sess in problem.sessions:
                for start_p in range(max(0, period_idx - sess.duration + 1), period_idx + 1):
                    key = (sess.id, day_idx, start_p, room.id)
                    if key in vars_ctx.x:
                        model.Add(vars_ctx.x[key] == 0)

    # 6. FACULTY DAILY MAX HOURS
    for faculty in problem.faculty:
        fac_sessions = sessions_by_faculty.get(faculty.id, [])
        if not fac_sessions:
            continue
        for day in range(days_count):
            daily_terms = []
            for sess in fac_sessions:
                for period in range(periods_per_day):
                    for room in problem.rooms:
                        key = (sess.id, day, period, room.id)
                        if key in vars_ctx.x:
                            daily_terms.append(sess.duration * vars_ctx.x[key])
            if daily_terms:
                model.Add(sum(daily_terms) <= faculty.max_hours_per_day)

    # 7. FIXED / LOCKED SESSIONS
    for sess in problem.sessions:
        if sess.is_locked and sess.locked_day is not None and sess.locked_period is not None:
            locked_key = (sess.id, sess.locked_day, sess.locked_period, sess.locked_room_id or "")
            for key, var in vars_ctx.x.items():
                if key[0] == sess.id:
                    if sess.locked_room_id:
                        if key == locked_key:
                            model.Add(var == 1)
                        else:
                            model.Add(var == 0)
                    else:
                        if key[1] == sess.locked_day and key[2] == sess.locked_period:
                            # keep allowed room options
                            pass
                        else:
                            model.Add(var == 0)
