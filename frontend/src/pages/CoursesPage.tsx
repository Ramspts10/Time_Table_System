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

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Courses Directory...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">Course Requirements & Equipment Matrix</h2>
            <p className="text-xs text-slate-400">Specify credits, weekly hours, lab duration, room type, and required equipment.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">Total Courses: {courses.length}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <th className="p-3">Code</th>
              <th className="p-3">Course Name</th>
              <th className="p-3">Sem</th>
              <th className="p-3">Weekly Hrs</th>
              <th className="p-3">Session Dur</th>
              <th className="p-3">Room Type</th>
              <th className="p-3">Required Equipment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {courses.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-purple-400">{c.course_code}</td>
                <td className="p-3 font-medium text-slate-200">{c.course_name}</td>
                <td className="p-3 text-slate-300">Sem {c.semester}</td>
                <td className="p-3 text-indigo-400 font-semibold">{c.weekly_hours}h / wk</td>
                <td className="p-3 font-semibold text-slate-300">{c.session_duration} period(s)</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    c.requires_lab ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {c.required_room_type}
                  </span>
                </td>
                <td className="p-3 flex flex-wrap gap-1">
                  {c.required_equipment?.map((eq, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-semibold">
                      {eq}
                    </span>
                  )) || <span className="text-slate-500">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
