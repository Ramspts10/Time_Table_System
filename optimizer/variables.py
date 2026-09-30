"""
Optimizer Data Structures and Variable Definitions for CP-SAT Engine.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple
from ortools.sat.python import cp_model


@dataclass
class PeriodConfigData:
    days: List[str]  # e.g. ["MON", "TUE", "WED", "THU", "FRI"]
    periods_per_day: int  # e.g. 8
    break_periods: List[int] = field(default_factory=list)  # 0-indexed period indices that are break/lunch


@dataclass
class RoomData:
    id: str
    name: str
    building: str
    capacity: int
    room_type: str  # CLASSROOM, LAB, COMPUTER_LAB, PHYSICS_LAB, CHEMISTRY_LAB, SEMINAR_HALL, AUDITORIUM
    equipment: List[str] = field(default_factory=list)
    available_days: List[str] = field(default_factory=list)
    unavailable_slots: Set[Tuple[int, int]] = field(default_factory=set)  # (day_idx, period_idx)


@dataclass
class FacultyData:
    id: str
    name: str
    department_id: str
    max_hours_per_day: int = 6
    max_hours_per_week: int = 24
    available_days: List[str] = field(default_factory=list)
    unavailable_slots: Set[Tuple[int, int]] = field(default_factory=set)  # (day_idx, period_idx)
    preferred_periods: List[int] = field(default_factory=list)
    preferred_rooms: List[str] = field(default_factory=list)


@dataclass
class SectionData:
    id: str
    name: str
    program: str
    semester: int
    student_count: int


@dataclass
class SessionToSchedule:
    id: str  # unique session instance id
    course_id: str
    course_code: str
    course_name: str
    section_id: str
    faculty_id: str
    duration: int  # period duration (e.g. 1 or 2)
    requires_lab: bool
    required_room_type: str
    required_equipment: List[str] = field(default_factory=list)
    preferred_periods: List[int] = field(default_factory=list)
    preferred_days: List[str] = field(default_factory=list)
    is_locked: bool = False
    locked_day: Optional[int] = None
    locked_period: Optional[int] = None
    locked_room_id: Optional[str] = None


@dataclass
class ConstraintWeights:
    faculty_gaps: int = 10
    student_gaps: int = 10
    room_capacity_waste: int = 2
    room_changes: int = 5
    undesirable_periods: int = 4
    preference_violations: int = 8
    workload_imbalance: int = 6


@dataclass
class SchedulingProblemData:
    institution_id: str
    period_config: PeriodConfigData
    rooms: List[RoomData]
    faculty: List[FacultyData]
    sections: List[SectionData]
    sessions: List[SessionToSchedule]
    weights: ConstraintWeights = field(default_factory=ConstraintWeights)


class OptimizationVariables:
    """
    Encapsulates CP-SAT decision variables for the scheduling problem.
    """
    def __init__(self, model: cp_model.CpModel, problem: SchedulingProblemData):
        self.model = model
        self.problem = problem
        self.days_count = len(problem.period_config.days)
        self.periods_per_day = problem.period_config.periods_per_day
        self.total_slots = self.days_count * self.periods_per_day

        # Map objects by ID
        self.rooms_by_id = {r.id: r for r in problem.rooms}
        self.faculty_by_id = {f.id: f for f in problem.faculty}
        self.sections_by_id = {s.id: s for s in problem.sections}

        # x[session_id, day, period, room_id] -> BoolVar
        self.x: Dict[Tuple[str, int, int, str], cp_model.BoolVar] = {}

        # Derived interval variables for non-overlap constraints
        self.session_interval: Dict[str, cp_model.IntervalVar] = {}
        self.session_start: Dict[str, cp_model.IntVar] = {}

        self._create_variables()

    def _create_variables(self):
        for sess in self.problem.sessions:
            section = self.sections_by_id.get(sess.section_id)
            student_count = section.student_count if section else 0

            # Find compatible rooms for this session
            compatible_rooms = []
            for room in self.problem.rooms:
                if room.capacity < student_count:
                    continue
                if sess.requires_lab and "LAB" not in room.room_type.upper():
                    continue
                if sess.required_room_type and sess.required_room_type != "ANY":
                    if sess.required_room_type.upper() not in room.room_type.upper() and room.room_type.upper() not in sess.required_room_type.upper():
                        continue
                # Equipment check
                if sess.required_equipment:
                    missing_eq = [eq for eq in sess.required_equipment if eq not in room.equipment]
                    if missing_eq:
                        continue
                compatible_rooms.append(room)

            # If no compatible rooms found, we still create variables for available rooms to let solver detect infeasibility
            if not compatible_rooms:
                compatible_rooms = [r for r in self.problem.rooms if r.capacity >= student_count]
                if not compatible_rooms:
                    compatible_rooms = self.problem.rooms

            # Create boolean variables for valid (day, period, room) triples
            for day in range(self.days_count):
                for period in range(self.periods_per_day):
                    # Check period continuity boundary
                    if period + sess.duration > self.periods_per_day:
                        continue
                    # Check break period collision
                    collides_break = False
                    for p in range(period, period + sess.duration):
                        if p in self.problem.period_config.break_periods:
                            collides_break = True
                            break
                    if collides_break and not sess.is_locked:
                        continue

                    for room in compatible_rooms:
                        var_name = f"x_{sess.id}_d{day}_p{period}_r{room.id}"
                        self.x[(sess.id, day, period, room.id)] = self.model.NewBoolVar(var_name)

            # Create integer variable for absolute start slot
            start_var = self.model.NewIntVar(0, self.total_slots - 1, f"start_{sess.id}")
            self.session_start[sess.id] = start_var

            # Link boolean vars to start_var
            slot_bools = []
            for (sess_id, day, period, room_id), bool_var in self.x.items():
                if sess_id == sess.id:
                    slot_idx = day * self.periods_per_day + period
                    # If bool_var is true, start_var must equal slot_idx
                    self.model.Add(start_var == slot_idx).OnlyEnforceIf(bool_var)
                    slot_bools.append(bool_var)

            # Exactly one assignment per session
            if slot_bools:
                self.model.Add(sum(slot_bools) == 1)
