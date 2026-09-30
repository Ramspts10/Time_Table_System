"""
SQLAlchemy Relational Models for Smart Timetable & Classroom Allocation.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, JSON, Enum, DateTime, Text, Table
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    HOD = "HOD"
    FACULTY = "FACULTY"
    STUDENT = "STUDENT"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FACULTY, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="users")


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    departments = relationship("Department", back_populates="institution", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="departments")
    users = relationship("User", back_populates="department")
    faculty = relationship("Faculty", back_populates="department", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")
    sections = relationship("Section", back_populates="department", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="department")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    max_hours_per_day = Column(Integer, default=6)
    max_hours_per_week = Column(Integer, default=24)
    available_days = Column(JSON, default=list)  # ["MON", "TUE", "WED", "THU", "FRI"]
    unavailable_slots = Column(JSON, default=list)  # [{"day": 0, "period": 1}]
    preferred_periods = Column(JSON, default=list)  # [0, 1, 2]
    preferred_rooms = Column(JSON, default=list)  # [room_id1, room_id2]
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="faculty")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    course_code = Column(String(50), nullable=False, index=True)
    course_name = Column(String(255), nullable=False)
    semester = Column(Integer, default=5)
    credits = Column(Integer, default=3)

    weekly_hours = Column(Integer, default=3)
    lecture_hours = Column(Integer, default=3)
    tutorial_hours = Column(Integer, default=0)
    lab_hours = Column(Integer, default=0)
    session_duration = Column(Integer, default=1)  # period duration per session (1 or 2)
    requires_lab = Column(Boolean, default=False)
    required_room_type = Column(String(100), default="CLASSROOM")
    required_equipment = Column(JSON, default=list)  # ["PROJECTOR", "GPU"]
    preferred_periods = Column(JSON, default=list)
    preferred_days = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="courses")


class Section(Base):
    __tablename__ = "sections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g. "CSE-3A"
    program = Column(String(100), default="B.Tech")
    semester = Column(Integer, default=5)
    student_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="sections")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    room_number = Column(String(50), nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(100), default="CLASSROOM")  # CLASSROOM, LAB, COMPUTER_LAB, SEMINAR_HALL, AUDITORIUM
    equipment = Column(JSON, default=list)  # ["PROJECTOR", "COMPUTERS", "GPU"]
    available_days = Column(JSON, default=list)
    unavailable_slots = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="rooms")


class PeriodConfig(Base):
    __tablename__ = "period_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    days = Column(JSON, default=lambda: ["MON", "TUE", "WED", "THU", "FRI"])
    periods_per_day = Column(Integer, default=8)
    start_time = Column(String(20), default="08:00")
    end_time = Column(String(20), default=16)
    period_duration_minutes = Column(Integer, default=60)
    break_periods = Column(JSON, default=lambda: [3])  # period index 3 is break
    lunch_period = Column(Integer, default=4)
    created_at = Column(DateTime, default=datetime.utcnow)


class ConstraintRule(Base):
    __tablename__ = "constraint_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    faculty_gaps_weight = Column(Integer, default=10)
    student_gaps_weight = Column(Integer, default=10)
    room_capacity_waste_weight = Column(Integer, default=2)
    room_changes_weight = Column(Integer, default=5)
    undesirable_periods_weight = Column(Integer, default=4)
    preference_violations_weight = Column(Integer, default=8)
    workload_imbalance_weight = Column(Integer, default=6)
    is_active = Column(Boolean, default=True)


class TimetableStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    OPTIMIZING = "OPTIMIZING"
    GENERATED = "GENERATED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    INFEASIBLE = "INFEASIBLE"


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    academic_term = Column(String(100), default="Fall 2026")
    status = Column(Enum(TimetableStatus), default=TimetableStatus.DRAFT)
    solver_status = Column(String(50), nullable=True)
    objective_score = Column(Float, nullable=True)
    solver_time_seconds = Column(Float, nullable=True)
    stats = Column(JSON, default=dict)
    bottlenecks = Column(JSON, default=list)
    possible_actions = Column(JSON, default=list)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timetable_id = Column(String(36), ForeignKey("timetables.id"), nullable=False)
    session_id = Column(String(100), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    section_id = Column(String(36), ForeignKey("sections.id"), nullable=False)
    faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=False)
    day_index = Column(Integer, nullable=False)
    period_index = Column(Integer, nullable=False)
    duration = Column(Integer, default=1)
    is_locked = Column(Boolean, default=False)

    timetable = relationship("Timetable", back_populates="entries")
    course = relationship("Course")
    section = relationship("Section")
    faculty = relationship("Faculty")
    room = relationship("Room")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
