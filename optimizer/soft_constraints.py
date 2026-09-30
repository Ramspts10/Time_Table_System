"""
Soft Constraints modeling for penalty calculation in CP-SAT objective.
"""
from typing import List, Dict, Tuple
from ortools.sat.python import cp_model
from optimizer.variables import OptimizationVariables, SchedulingProblemData


def build_soft_penalties(model: cp_model.CpModel, vars_ctx: OptimizationVariables, problem: SchedulingProblemData) -> List[cp_model.LinearExpr]:
    penalties: List[cp_model.LinearExpr] = []
    weights = problem.weights
    days_count = vars_ctx.days_count
    periods_per_day = vars_ctx.periods_per_day

    # 1. ROOM CAPACITY WASTAGE PENALTY
    for (sess_id, day, period, room_id), var in vars_ctx.x.items():
        room = vars_ctx.rooms_by_id.get(room_id)
        sess = next((s for s in problem.sessions if s.id == sess_id), None)
        if room and sess:
            sec = vars_ctx.sections_by_id.get(sess.section_id)
            student_count = sec.student_count if sec else 0
            waste = max(0, room.capacity - student_count)
            if waste > 0 and weights.room_capacity_waste > 0:
                penalties.append(var * (waste * weights.room_capacity_waste))

    # 2. FACULTY PREFERENCES / UNDESIRABLE PERIODS PENALTY
    for sess in problem.sessions:
        fac = vars_ctx.faculty_by_id.get(sess.faculty_id)
        for (sess_id, day, period, room_id), var in vars_ctx.x.items():
            if sess_id == sess.id:
                # Preferred period check
                if fac and fac.preferred_periods and period not in fac.preferred_periods:
                    penalties.append(var * weights.preference_violations)
                # Course preferred period check
                if sess.preferred_periods and period not in sess.preferred_periods:
                    penalties.append(var * weights.undesirable_periods)
                # Preferred room check
                if fac and fac.preferred_rooms and room_id not in fac.preferred_rooms:
                    penalties.append(var * (weights.preference_violations // 2))

    # 3. SECTION ROOM CHANGES PENALTY ON SAME DAY
    # Penalize when section uses >1 distinct rooms on the same day
    for section in problem.sections:
        sec_sessions = [s for s in problem.sessions if s.section_id == section.id]
        if len(sec_sessions) <= 1:
            continue

        for day in range(days_count):
            used_rooms = []
            for room in problem.rooms:
                room_used_on_day = model.NewBoolVar(f"sec_{section.id}_d{day}_r{room.id}_used")
                room_session_vars = []
                for sess in sec_sessions:
                    for period in range(periods_per_day):
                        key = (sess.id, day, period, room.id)
                        if key in vars_ctx.x:
                            room_session_vars.append(vars_ctx.x[key])
                if room_session_vars:
                    model.AddMaxEquality(room_used_on_day, room_session_vars)
                    used_rooms.append(room_used_on_day)

            if len(used_rooms) > 1:
                # If sum of used_rooms > 1, penalize excess
                excess_rooms = model.NewIntVar(0, len(used_rooms), f"sec_{section.id}_d{day}_excess_rooms")
                model.Add(excess_rooms >= sum(used_rooms) - 1)
                penalties.append(excess_rooms * weights.room_changes)

    # 4. STUDENT & FACULTY GAPS PENALTY (Simplified linear approximation)
    # Penalize non-consecutive classes by checking gaps between consecutive period pairs
    for section in problem.sections:
        sec_sessions = [s for s in problem.sessions if s.section_id == section.id]
        for day in range(days_count):
            for p in range(1, periods_per_day - 1):
                # Is section active at p-1, inactive at p, active at p+1?
                p_prev_active = model.NewBoolVar(f"sec_{section.id}_d{day}_p{p-1}_act")
                p_curr_active = model.NewBoolVar(f"sec_{section.id}_d{day}_p{p}_act")
                p_next_active = model.NewBoolVar(f"sec_{section.id}_d{day}_p{p+1}_act")

                vars_prev = [vars_ctx.x[k] for k in vars_ctx.x if k[0] in [s.id for s in sec_sessions] and k[1] == day and k[2] == p-1]
                vars_curr = [vars_ctx.x[k] for k in vars_ctx.x if k[0] in [s.id for s in sec_sessions] and k[1] == day and k[2] == p]
                vars_next = [vars_ctx.x[k] for k in vars_ctx.x if k[0] in [s.id for s in sec_sessions] and k[1] == day and k[2] == p+1]

                if vars_prev and vars_next:
                    model.AddMaxEquality(p_prev_active, vars_prev)
                    if vars_curr:
                        model.AddMaxEquality(p_curr_active, vars_curr)
                    else:
                        model.Add(p_curr_active == 0)
                    model.AddMaxEquality(p_next_active, vars_next)

                    gap_indicator = model.NewBoolVar(f"sec_{section.id}_d{day}_p{p}_gap")
                    # gap_indicator is true if prev active AND next active AND NOT curr active
                    model.Add(gap_indicator == 1).OnlyEnforceIf([p_prev_active, p_next_active, p_curr_active.Not()])
                    model.Add(gap_indicator == 0).OnlyEnforceIf(p_curr_active)
                    model.Add(gap_indicator == 0).OnlyEnforceIf(p_prev_active.Not())
                    model.Add(gap_indicator == 0).OnlyEnforceIf(p_next_active.Not())

                    penalties.append(gap_indicator * weights.student_gaps)

    return penalties
