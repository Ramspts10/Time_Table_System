"""
Unit tests for Optimizer Engine (CP-SAT, Validator, Repair, What-If).
"""
from optimizer.variables import (
    SchedulingProblemData, PeriodConfigData, RoomData, FacultyData,
    SectionData, SessionToSchedule, ConstraintWeights
)
from optimizer.solver import TimetableSolver
from optimizer.validator import TimetableValidator
from optimizer.repair import TimetableRepairEngine, WhatIfScenario


def test_optimizer_basic():
    period_cfg = PeriodConfigData(
        days=["MON", "TUE", "WED", "THU", "FRI"],
        periods_per_day=8,
        break_periods=[3]  # Period 3 is lunch break
    )

    rooms = [
        RoomData(id="r1", name="Room 101", building="Block A", capacity=60, room_type="CLASSROOM"),
        RoomData(id="r2", name="Room 102", building="Block A", capacity=40, room_type="CLASSROOM"),
        RoomData(id="lab1", name="CS Lab 1", building="Block B", capacity=35, room_type="COMPUTER_LAB", equipment=["COMPUTERS", "GPU"])
    ]

    faculty = [
        FacultyData(id="f1", name="Dr. Smith", department_id="dept1", max_hours_per_day=5),
        FacultyData(id="f2", name="Prof. Jones", department_id="dept1", max_hours_per_day=5)
    ]

    sections = [
        SectionData(id="sec1", name="CSE-3A", program="B.Tech", semester=5, student_count=50),
        SectionData(id="sec2", name="CSE-3B", program="B.Tech", semester=5, student_count=30)
    ]

    sessions = [
        SessionToSchedule(id="s1", course_id="c1", course_code="CS301", course_name="Data Structures", section_id="sec1", faculty_id="f1", duration=1, requires_lab=False, required_room_type="CLASSROOM"),
        SessionToSchedule(id="s2", course_id="c1", course_code="CS301", course_name="Data Structures", section_id="sec1", faculty_id="f1", duration=1, requires_lab=False, required_room_type="CLASSROOM"),
        SessionToSchedule(id="s3", course_id="c2", course_code="CS302", course_name="Algorithms Lab", section_id="sec2", faculty_id="f2", duration=2, requires_lab=True, required_room_type="COMPUTER_LAB", required_equipment=["GPU"])
    ]

    problem = SchedulingProblemData(
        institution_id="inst1",
        period_config=period_cfg,
        rooms=rooms,
        faculty=faculty,
        sections=sections,
        sessions=sessions
    )

    # 1. Test Solver
    solver = TimetableSolver(time_limit_seconds=10.0)
    res = solver.solve(problem)
    print("Solver Status:", res.status)
    print("Scheduled count:", len(res.assignments))
    assert res.status in ("OPTIMAL", "FEASIBLE"), f"Solver failed: {res.status}"
    assert len(res.assignments) == 3, f"Expected 3 assignments, got {len(res.assignments)}"

    # 2. Test Validator
    validator = TimetableValidator()
    val_res = validator.validate(problem, res.assignments)
    print("Validation is_valid:", val_res.is_valid, "conflicts:", val_res.total_conflicts)
    assert val_res.is_valid, f"Validation errors: {val_res.errors}"

    # 3. Test Repair
    repair_engine = TimetableRepairEngine(time_limit_seconds=10.0)
    # Simulate room 101 disruption on day 0
    repair_res = repair_engine.repair_disruption(problem, res.assignments, broken_room_id="r1", broken_day=0)
    print("Repair Status:", repair_res.status, "repaired:", repair_res.repaired)
    assert repair_res.repaired, "Repair failed to produce valid timetable"

    # 4. Test What-If Simulation
    scenario = WhatIfScenario(
        unavailable_room_ids=["lab1"]
    )
    whatif_res = repair_engine.simulate_what_if(problem, res.assignments, scenario)
    print("What-if lab1 unavailable feasible:", whatif_res["feasible"])

    print("ALL OPTIMIZER TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_optimizer_basic()
