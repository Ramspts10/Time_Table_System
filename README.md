# Smart Timetable & Classroom Allocation Platform

A production-quality university scheduling and classroom allocation system powered by **Google OR-Tools CP-SAT (Constraint Programming)**, FastAPI, React, and PostgreSQL.

---

## 🌟 Key Features

1. **Google OR-Tools CP-SAT Constraint Engine**:
   - Solves complex institutional scheduling problems enforcing hard constraints (Faculty collision, Section collision, Room collision, Capacity, Room type matching, Specialized equipment matching, Faculty availability, Break period exclusions).
   - Minimizes soft penalties (Faculty gaps, Student gaps, Room capacity wastage, Section room changes, Preference violations, Workload imbalance).

2. **Independent Timetable Validator**:
   - Independent validation engine that verifies every schedule (generated or manually modified) against all hard constraints.
   - Provides machine-readable and human-readable conflict diagnostic logs.

3. **Automatic Local Repair**:
   - Re-optimizes only affected sessions when disruptions occur (faculty absence, room flooding) while locking unaffected sessions.

4. **What-If Simulation Sandbox**:
   - Simulates temporary room closures, faculty absences, or section capacity growth without altering production database state.

5. **Role-Based Access Control (RBAC)**:
   - Supports `SUPER_ADMIN`, `ADMIN`, `HOD`, `FACULTY`, and `STUDENT` roles.

6. **Interactive Timetable Matrix UI**:
   - View schedules by Section, Faculty, Room, or Department.
   - Manual slot editing with instant constraint validation feedback.
   - One-click exports to CSV, Excel (`.xlsx`), and JSON.

---

## 🚀 Quick Start & How to Run

### Method 1: Running with Docker Compose (Recommended)

Run the entire stack (PostgreSQL, Redis, FastAPI Backend, React Frontend, Nginx) with a single command:

```bash
docker compose up --build
```

Access the application:
- **Frontend Portal**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`

---

### Method 2: Running Locally (Development Mode)

#### 1. Backend & CP-SAT Engine Setup
```bash
# Navigate to project root
cd smart-timetable

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/macOS

# Install backend dependencies
pip install -r backend/requirements.txt

# Run seed data generator
python -m database.seed.seed_data

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# Open a new terminal in smart-timetable/frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Access the development frontend at `http://localhost:3000`.

---

## 🔐 Seed User Credentials (Demo Accounts)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@apex.edu` | `password123` |
| **HOD (CSE)** | `hod.cse@apex.edu` | `password123` |
| **Faculty** | `alan.turing@apex.edu` | `password123` |
| **Student** | `student.cse@apex.edu` | `password123` |

---

## 🧪 Running Automated Tests

```bash
# Run CP-SAT Optimizer Engine unit tests
python -m optimizer.test_optimizer

# Run FastAPI Backend API & Validation integration tests
python -m backend.tests.test_backend_api
```

---

## 📂 Project Architecture

```text
smart-timetable/
├── backend/            # FastAPI REST API & SQLAlchemy Models
├── optimizer/          # Google OR-Tools CP-SAT Constraint Engine
├── frontend/           # React 18 + TypeScript + Vite + Tailwind CSS UI
├── database/           # SQLite / PostgreSQL Seed Data & Migrations
├── docker/             # Dockerfiles & Nginx Configurations
├── docker-compose.yml  # Container Orchestration Specification
└── README.md           # Project Documentation
```
