"""
Pydantic Schemas for API Serialization.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "FACULTY"
    department_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    name: str
    code: str


class DepartmentResponse(BaseModel):
    id: str
    institution_id: str
    name: str
    code: str

    class Config:
        from_attributes = True


class FacultyCreate(BaseModel):
    department_id: str
    name: str
    email: str
    max_hours_per_day: int = 6
    max_hours_per_week: int = 24
    available_days: List[str] = ["MON", "TUE", "WED", "THU", "FRI"]
    unavailable_slots: List[Dict[str, int]] = []
    preferred_periods: List[int] = []
    preferred_rooms: List[str] = []


class FacultyResponse(FacultyCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    department_id: str
    course_code: str
    course_name: str
    semester: int = 5
    credits: int = 3

    weekly_hours: int = 3
    lecture_hours: int = 3
    tutorial_hours: int = 0
    lab_hours: int = 0
    session_duration: int = 1
    requires_lab: bool = False
    required_room_type: str = "CLASSROOM"
    required_equipment: List[str] = []
    preferred_periods: List[int] = []
    preferred_days: List[str] = []


class CourseResponse(CourseCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class SectionCreate(BaseModel):
    department_id: str
    name: str
    program: str = "B.Tech"
    semester: int = 5
    student_count: int


class SectionResponse(SectionCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoomCreate(BaseModel):
    department_id: Optional[str] = None
    room_number: str
    building: str
    floor: int = 1
    capacity: int
    room_type: str = "CLASSROOM"
    equipment: List[str] = []
    available_days: List[str] = ["MON", "TUE", "WED", "THU", "FRI"]
    unavailable_slots: List[Dict[str, int]] = []


class RoomResponse(RoomCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class PeriodConfigCreate(BaseModel):
    days: List[str] = ["MON", "TUE", "WED", "THU", "FRI"]
    periods_per_day: int = 8
    start_time: str = "08:00"
    end_time: str = "16:00"
    period_duration_minutes: int = 60
    break_periods: List[int] = [3]
    lunch_period: int = 4


class PeriodConfigResponse(PeriodConfigCreate):
    id: str
    institution_id: str

    class Config:
        from_attributes = True


class ConstraintRuleUpdate(BaseModel):
    faculty_gaps_weight: int = 10
    student_gaps_weight: int = 10
    room_capacity_waste_weight: int = 2
    room_changes_weight: int = 5
    undesirable_periods_weight: int = 4
    preference_violations_weight: int = 8
    workload_imbalance_weight: int = 6


class TimetableEntryResponse(BaseModel):
    id: str
    session_id: str
    course_id: str
    course_code: str
    course_name: str
    section_id: str
    section_name: str
    faculty_id: str
    faculty_name: str
    room_id: str
    room_name: str
    day_index: int
    period_index: int
    duration: int
    is_locked: bool


class TimetableResponse(BaseModel):
    id: str
    name: str
    academic_term: str
    status: str
    solver_status: Optional[str] = None
    objective_score: Optional[float] = None
    solver_time_seconds: Optional[float] = None
    stats: Dict[str, Any] = {}
    bottlenecks: List[str] = []
    possible_actions: List[str] = []
    is_published: bool
    entries: List[TimetableEntryResponse] = []
    created_at: datetime


class GenerateTimetableRequest(BaseModel):
    name: str = "Spring 2026 Schedule"
    academic_term: str = "Spring 2026"
    time_limit_seconds: float = 30.0


class ManualEditEntryRequest(BaseModel):
    entry_id: str
    new_day_index: int
    new_period_index: int
    new_room_id: str


class RepairRequest(BaseModel):
    broken_faculty_id: Optional[str] = None
    broken_room_id: Optional[str] = None
    broken_day: Optional[int] = None
    broken_period: Optional[int] = None


class WhatIfRequest(BaseModel):
    unavailable_room_ids: List[str] = []
    unavailable_faculty_slots: List[Dict[str, Any]] = []
    section_capacity_changes: Dict[str, int] = {}
