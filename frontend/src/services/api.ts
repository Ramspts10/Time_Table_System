import {
  Faculty, Course, Section, Room, PeriodConfig, ConstraintRules,
  Timetable, ValidationResult
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid email or password');
    return res.json();
  },

  // Faculty
  getFaculty: async (): Promise<Faculty[]> => {
    const res = await fetch(`${API_BASE}/faculty`);
    return res.json();
  },

  // Courses
  getCourses: async (): Promise<Course[]> => {
    const res = await fetch(`${API_BASE}/courses`);
    return res.json();
  },

  // Sections
  getSections: async (): Promise<Section[]> => {
    const res = await fetch(`${API_BASE}/sections`);
    return res.json();
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    const res = await fetch(`${API_BASE}/rooms`);
    return res.json();
  },

  // Periods
  getPeriodConfig: async (): Promise<PeriodConfig> => {
    const res = await fetch(`${API_BASE}/periods`);
    return res.json();
  },

  updatePeriodConfig: async (cfg: Partial<PeriodConfig>): Promise<PeriodConfig> => {
    const res = await fetch(`${API_BASE}/periods`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    return res.json();
  },

  // Constraints
  getConstraints: async (): Promise<ConstraintRules> => {
    const res = await fetch(`${API_BASE}/constraints`);
    return res.json();
  },

  updateConstraints: async (rules: Partial<ConstraintRules>): Promise<ConstraintRules> => {
    const res = await fetch(`${API_BASE}/constraints`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
    return res.json();
  },

  // Timetables
  generateTimetable: async (name: string, academic_term: string, time_limit_seconds: number = 30) => {
    const res = await fetch(`${API_BASE}/timetables/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, academic_term, time_limit_seconds })
    });
    return res.json();
  },

  getTimetables: async (): Promise<Timetable[]> => {
    const res = await fetch(`${API_BASE}/timetables`);
    return res.json();
  },

  getTimetable: async (id: string): Promise<Timetable> => {
    const res = await fetch(`${API_BASE}/timetables/${id}`);
    return res.json();
  },

  validateTimetable: async (id: string): Promise<ValidationResult> => {
    const res = await fetch(`${API_BASE}/timetables/${id}/validate`, { method: 'POST' });
    return res.json();
  },

  manualEditEntry: async (id: string, entry_id: string, new_day_index: number, new_period_index: number, new_room_id: string) => {
    const res = await fetch(`${API_BASE}/timetables/${id}/manual-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id, new_day_index, new_period_index, new_room_id })
    });
    return res.json();
  },

  repairTimetable: async (id: string, params: { broken_faculty_id?: string; broken_room_id?: string; broken_day?: number; broken_period?: number }) => {
    const res = await fetch(`${API_BASE}/timetables/${id}/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  simulateWhatIf: async (id: string, scenario: { unavailable_room_ids?: string[]; unavailable_faculty_slots?: any[]; section_capacity_changes?: Record<string, number> }) => {
    const res = await fetch(`${API_BASE}/timetables/${id}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    return res.json();
  },

  publishTimetable: async (id: string) => {
    const res = await fetch(`${API_BASE}/timetables/${id}/publish`, { method: 'POST' });
    return res.json();
  },

  // Analytics
  getDashboardAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return res.json();
  },

  getRoomAnalytics: async (timetable_id: string) => {
    const res = await fetch(`${API_BASE}/analytics/rooms/${timetable_id}`);
    return res.json();
  },

  getFacultyAnalytics: async (timetable_id: string) => {
    const res = await fetch(`${API_BASE}/analytics/faculty/${timetable_id}`);
    return res.json();
  }
};
