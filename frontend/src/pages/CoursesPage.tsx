import React, { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, Layers, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourses().then(res => setCourses(res)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Courses Directory...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Course Requirements & Equipment Matrix</h2>
            <p className="text-xs text-slate-500 font-medium">Specify credits, weekly hours, lab duration, room type, and required equipment.</p>
          </div>
        </div>
        <span className="px-3.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">Total Courses: {courses.length}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold">
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Course Name</th>
              <th className="p-3.5">Sem</th>
              <th className="p-3.5">Weekly Hrs</th>
              <th className="p-3.5">Session Dur</th>
              <th className="p-3.5">Room Type</th>
              <th className="p-3.5">Required Equipment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/80">
                <td className="p-3.5 font-black text-purple-700">{c.course_code}</td>
                <td className="p-3.5 font-bold text-slate-900">{c.course_name}</td>
                <td className="p-3.5 text-slate-700 font-semibold">Sem {c.semester}</td>
                <td className="p-3.5 text-indigo-700 font-bold">{c.weekly_hours}h / wk</td>
                <td className="p-3.5 font-bold text-slate-800">{c.session_duration} period(s)</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                    c.requires_lab ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {c.required_room_type}
                  </span>
                </td>
                <td className="p-3.5 flex flex-wrap gap-1">
                  {c.required_equipment?.map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-[9px] font-bold">
                      {eq}
                    </span>
                  )) || <span className="text-slate-400 font-medium">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
