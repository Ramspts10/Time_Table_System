export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;

  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
}

export interface Faculty {
  id: string;
  department_id: string;
  name: string;
  email: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  available_days: string[];
  unavailable_slots: { day: number; period: number }[];
  preferred_periods: number[];
  preferred_rooms: string[];
}

export interface Course {
  id: string;
  department_id: string;
  course_code: string;
  course_name: string;
  semester: number;
  credits: number;
  weekly_hours: number;
  lecture_hours: number;
  lab_hours: number;
  session_duration: number;
  requires_lab: boolean;
  required_room_type: string;
  required_equipment: string[];
}

export interface Section {
  id: string;
  department_id: string;
  name: string;
  program: string;
  semester: number;
  student_count: number;
}

export interface Room {
  id: string;
  department_id?: string;
  room_number: string;
  building: string;
  floor: number;
  capacity: number;
  room_type: string;
  equipment: string[];
  available_days: string[];
  unavailable_slots: { day: number; period: number }[];
}

export interface PeriodConfig {
  days: string[];
  periods_per_day: number;
  start_time: string;
  end_time: string;
  period_duration_minutes: number;
  break_periods: number[];
  lunch_period: number;
}

export interface ConstraintRules {
  faculty_gaps_weight: number;
  student_gaps_weight: number;
  room_capacity_waste_weight: number;
  room_changes_weight: number;
  undesirable_periods_weight: number;
  preference_violations_weight: number;
  workload_imbalance_weight: number;
}

export interface TimetableEntry {
  id: string;
  session_id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  section_id: string;
  section_name: string;
  faculty_id: string;
  faculty_name: string;
  room_id: string;
  room_name: string;
  day_index: number;
  period_index: number;
  duration: number;
  is_locked: boolean;
}

export interface Timetable {
  id: string;
  name: string;
  academic_term: string;
  status: string;
  solver_status?: string;
  objective_score?: number;
  solver_time_seconds?: number;
  stats?: Record<string, any>;
  bottlenecks?: string[];
  possible_actions?: string[];
  is_published: boolean;
  entries?: TimetableEntry[];
  created_at?: string;
}

export interface ConflictDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  is_valid: boolean;
  total_conflicts: number;
  errors: ConflictDetail[];
  warnings: string[];
}
