"""
Comprehensive Seed Data Generator for Smart Timetable & Classroom Allocation Platform.
Creates realistic institutional data (1 Institution, 3 Depts, 15 Faculty, 25 Courses, 8 Sections, 20 Rooms, Seed Users).
"""
import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, UserRole, Institution, Department, Faculty, Course, Section, Room,
    PeriodConfig, ConstraintRule, Timetable, TimetableStatus
)


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@apex.edu").first():
            print("Database already contains seed admin user. Skipping seed generation.")
            return


        print("Seeding database with realistic institutional data...")

        # 1. Institution
        inst = Institution(
            name="Apex Institute of Technology",
            code="AIT-MAIN",
            address="100 University Boulevard, Tech Park, CA"
        )
        db.add(inst)
        db.flush()

        # 2. Departments
        dept_cse = Department(institution_id=inst.id, name="Computer Science & Engineering", code="CSE")
        dept_ece = Department(institution_id=inst.id, name="Electronics & Communication", code="ECE")
        dept_mech = Department(institution_id=inst.id, name="Mechanical Engineering", code="MECH")
        db.add_all([dept_cse, dept_ece, dept_mech])
        db.flush()

        # 3. Users (Super Admin, Admin, HODs, Faculty, Student)
        hashed_pw = get_password_hash("password123")
        users = [
            User(email="superadmin@apex.edu", hashed_password=hashed_pw, full_name="System Super Admin", role=UserRole.SUPER_ADMIN),
            User(email="admin@apex.edu", hashed_password=hashed_pw, full_name="Registrar Admin", role=UserRole.ADMIN),
            User(email="hod.cse@apex.edu", hashed_password=hashed_pw, full_name="Dr. Alan Turing (HOD CSE)", role=UserRole.HOD, department_id=dept_cse.id),
            User(email="hod.ece@apex.edu", hashed_password=hashed_pw, full_name="Dr. Claude Shannon (HOD ECE)", role=UserRole.HOD, department_id=dept_ece.id),
            User(email="student.cse@apex.edu", hashed_password=hashed_pw, full_name="John Doe (Student)", role=UserRole.STUDENT, department_id=dept_cse.id),
        ]
        db.add_all(users)
        db.flush()

        # 4. Faculty (15 Faculty members)
        faculty_data = [
            # CSE (6)
            ("Dr. Alan Turing", "alan.turing@apex.edu", dept_cse.id, 5, 20),
            ("Dr. Grace Hopper", "grace.hopper@apex.edu", dept_cse.id, 6, 22),
            ("Prof. Donald Knuth", "donald.knuth@apex.edu", dept_cse.id, 5, 20),
            ("Dr. Barbara Liskov", "barbara.liskov@apex.edu", dept_cse.id, 6, 24),
            ("Prof. Ken Thompson", "ken.thompson@apex.edu", dept_cse.id, 5, 18),
            ("Dr. Margaret Hamilton", "margaret.hamilton@apex.edu", dept_cse.id, 6, 20),
            # ECE (5)
            ("Dr. Claude Shannon", "claude.shannon@apex.edu", dept_ece.id, 5, 20),
            ("Prof. Nikola Tesla", "nikola.tesla@apex.edu", dept_ece.id, 6, 22),
            ("Dr. Heinrich Hertz", "heinrich.hertz@apex.edu", dept_ece.id, 5, 18),
            ("Prof. Michael Faraday", "michael.faraday@apex.edu", dept_ece.id, 6, 24),
            ("Dr. James Maxwell", "james.maxwell@apex.edu", dept_ece.id, 5, 20),
            # MECH (4)
            ("Dr. James Watt", "james.watt@apex.edu", dept_mech.id, 6, 22),
            ("Prof. Rudolf Diesel", "rudolf.diesel@apex.edu", dept_mech.id, 5, 20),
            ("Dr. Henry Ford", "henry.ford@apex.edu", dept_mech.id, 6, 22),
            ("Prof. Isaac Newton", "isaac.newton@apex.edu", dept_mech.id, 5, 18),
        ]

        faculty_objs = []
        for name, email, dept_id, max_d, max_w in faculty_data:
            fac_user = User(email=email, hashed_password=hashed_pw, full_name=name, role=UserRole.FACULTY, department_id=dept_id)
            db.add(fac_user)
            db.flush()
            fac = Faculty(
                department_id=dept_id,
                user_id=fac_user.id,
                name=name,
                email=email,
                max_hours_per_day=max_d,
                max_hours_per_week=max_w,
                available_days=["MON", "TUE", "WED", "THU", "FRI"],
                unavailable_slots=[],
                preferred_periods=[0, 1, 2, 4, 5]
            )
            faculty_objs.append(fac)
            db.add(fac)
        db.flush()

        # 5. Sections (8 Sections)
        sections_data = [
            ("CSE-3A", dept_cse.id, "B.Tech", 5, 55),
            ("CSE-3B", dept_cse.id, "B.Tech", 5, 52),
            ("CSE-4A", dept_cse.id, "B.Tech", 7, 48),
            ("ECE-3A", dept_ece.id, "B.Tech", 5, 60),
            ("ECE-3B", dept_ece.id, "B.Tech", 5, 50),
            ("ECE-4A", dept_ece.id, "B.Tech", 7, 45),
            ("MECH-3A", dept_mech.id, "B.Tech", 5, 40),
            ("MECH-4A", dept_mech.id, "B.Tech", 7, 38),
        ]
        sec_objs = []
        for name, d_id, prog, sem, cap in sections_data:
            sec = Section(department_id=d_id, name=name, program=prog, semester=sem, student_count=cap)
            sec_objs.append(sec)
            db.add(sec)
        db.flush()

        # 6. Courses (25 Courses)
        courses_data = [
            # CSE
            ("CS301", "Data Structures & Algorithms", dept_cse.id, 5, 3, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("CS302", "Database Management Systems", dept_cse.id, 5, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("CS303", "DBMS Lab", dept_cse.id, 5, 2, 2, 2, True, "COMPUTER_LAB", ["COMPUTERS"]),
            ("CS304", "Operating Systems", dept_cse.id, 5, 3, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("CS305", "Artificial Intelligence & ML", dept_cse.id, 7, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("CS306", "AI & Deep Learning Lab", dept_cse.id, 7, 2, 2, 2, True, "COMPUTER_LAB", ["COMPUTERS", "GPU"]),
            ("CS307", "Computer Networks", dept_cse.id, 7, 3, 3, 1, False, "CLASSROOM", []),
            ("CS308", "Web Technologies", dept_cse.id, 7, 3, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("CS309", "Cloud Computing Lab", dept_cse.id, 7, 2, 2, 2, True, "COMPUTER_LAB", ["COMPUTERS"]),

            # ECE
            ("EC301", "Digital Signal Processing", dept_ece.id, 5, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("EC302", "Microcontrollers & Embedded Systems", dept_ece.id, 5, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("EC303", "Embedded Systems Lab", dept_ece.id, 5, 2, 2, 2, True, "LAB", ["SPECIALIZED_EQUIPMENT"]),
            ("EC304", "Analog Communication", dept_ece.id, 5, 3, 3, 1, False, "CLASSROOM", []),
            ("EC305", "VLSI Design", dept_ece.id, 7, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("EC306", "VLSI CAD Lab", dept_ece.id, 7, 2, 2, 2, True, "COMPUTER_LAB", ["COMPUTERS"]),
            ("EC307", "Electromagnetic Theory", dept_ece.id, 7, 3, 3, 1, False, "CLASSROOM", []),
            ("EC308", "Digital Electronics Lab", dept_ece.id, 7, 2, 2, 2, True, "LAB", ["SPECIALIZED_EQUIPMENT"]),

            # MECH
            ("ME301", "Thermodynamics", dept_mech.id, 5, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("ME302", "Fluid Mechanics", dept_mech.id, 5, 3, 3, 1, False, "CLASSROOM", []),
            ("ME303", "Fluid Machinery Lab", dept_mech.id, 5, 2, 2, 2, True, "LAB", ["SPECIALIZED_EQUIPMENT"]),
            ("ME304", "CAD/CAM Manufacturing", dept_mech.id, 5, 4, 3, 1, False, "CLASSROOM", ["PROJECTOR"]),
            ("ME305", "CAD Simulation Lab", dept_mech.id, 7, 2, 2, 2, True, "COMPUTER_LAB", ["COMPUTERS", "GPU"]),
            ("ME306", "Heat Transfer", dept_mech.id, 7, 3, 3, 1, False, "CLASSROOM", []),
            ("ME307", "Kinematics of Machines", dept_mech.id, 7, 3, 3, 1, False, "CLASSROOM", []),
            ("ME308", "Mechanical Workshop", dept_mech.id, 7, 2, 2, 2, True, "LAB", ["SPECIALIZED_EQUIPMENT"]),
        ]
        course_objs = []
        for code, name, d_id, sem, cr, hrs, dur, req_lab, r_type, eq in courses_data:
            c = Course(
                department_id=d_id,
                course_code=code,
                course_name=name,
                semester=sem,
                credits=cr,
                weekly_hours=hrs,
                lecture_hours=hrs if not req_lab else 0,
                lab_hours=hrs if req_lab else 0,
                session_duration=dur,
                requires_lab=req_lab,
                required_room_type=r_type,
                required_equipment=eq
            )
            course_objs.append(c)
            db.add(c)
        db.flush()


        # 7. Rooms (20 Rooms total, including 5 Labs)
        rooms_data = [
            # Classrooms
            ("101", "Building A", 1, 65, "CLASSROOM", ["PROJECTOR"]),
            ("102", "Building A", 1, 60, "CLASSROOM", ["PROJECTOR"]),
            ("103", "Building A", 1, 55, "CLASSROOM", []),
            ("104", "Building A", 1, 50, "CLASSROOM", ["PROJECTOR"]),
            ("201", "Building A", 2, 70, "CLASSROOM", ["PROJECTOR", "SMART_BOARD"]),
            ("202", "Building A", 2, 65, "CLASSROOM", ["PROJECTOR"]),
            ("203", "Building A", 2, 60, "CLASSROOM", []),
            ("204", "Building A", 2, 55, "CLASSROOM", ["PROJECTOR"]),
            ("301", "Building B", 1, 80, "CLASSROOM", ["PROJECTOR", "SMART_BOARD"]),
            ("302", "Building B", 1, 75, "CLASSROOM", ["PROJECTOR"]),
            ("303", "Building B", 1, 60, "CLASSROOM", []),
            ("304", "Building B", 1, 50, "CLASSROOM", ["PROJECTOR"]),
            ("401", "Building C", 1, 100, "SEMINAR_HALL", ["PROJECTOR", "SMART_BOARD"]),
            ("402", "Building C", 2, 200, "AUDITORIUM", ["PROJECTOR", "SMART_BOARD"]),
            ("105", "Building A", 1, 45, "CLASSROOM", []),

            # 5 Specialized Laboratories
            ("LAB-CS1", "Building B", 2, 60, "COMPUTER_LAB", ["COMPUTERS", "PROJECTOR"]),
            ("LAB-CS2", "Building B", 2, 50, "COMPUTER_LAB", ["COMPUTERS", "GPU", "PROJECTOR"]),
            ("LAB-EC1", "Building B", 3, 65, "LAB", ["SPECIALIZED_EQUIPMENT", "PROJECTOR"]),

            ("LAB-EC2", "Building B", 3, 50, "COMPUTER_LAB", ["COMPUTERS"]),
            ("LAB-ME1", "Building C", 1, 45, "LAB", ["SPECIALIZED_EQUIPMENT"]),
        ]
        for r_num, bld, fl, cap, r_type, eq in rooms_data:
            room = Room(
                department_id=dept_cse.id if "CS" in r_num else (dept_ece.id if "EC" in r_num else None),
                room_number=r_num,
                building=bld,
                floor=fl,
                capacity=cap,
                room_type=r_type,
                equipment=eq,
                available_days=["MON", "TUE", "WED", "THU", "FRI"],
                unavailable_slots=[]
            )
            db.add(room)
        db.flush()

        # 8. Period Configuration
        period_cfg = PeriodConfig(
            institution_id=inst.id,
            days=["MON", "TUE", "WED", "THU", "FRI"],
            periods_per_day=8,
            start_time="08:00",
            end_time="16:00",
            period_duration_minutes=60,
            break_periods=[3],  # Period index 3 (11:00-12:00) is break/lunch
            lunch_period=3
        )
        db.add(period_cfg)

        # 9. Constraint Rules
        c_rule = ConstraintRule(
            institution_id=inst.id,
            faculty_gaps_weight=10,
            student_gaps_weight=10,
            room_capacity_waste_weight=2,
            room_changes_weight=5,
            undesirable_periods_weight=4,
            preference_violations_weight=8,
            workload_imbalance_weight=6
        )
        db.add(c_rule)

        db.commit()
        print("Database seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
