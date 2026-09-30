import React, { useEffect, useState } from 'react';
import { Users, Clock, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Faculty } from '../types';

export const FacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFaculty().then(res => setFaculty(res)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Faculty Roster...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Institutional Faculty Roster</h2>
            <p className="text-xs text-slate-500 font-medium">Manage faculty workload limits, availability slots, and preferences.</p>
          </div>
        </div>
        <span className="px-3.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">Total: {faculty.length}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold">
              <th className="p-3.5">Faculty Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Max Daily Hours</th>
              <th className="p-3.5">Max Weekly Hours</th>
              <th className="p-3.5">Working Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {faculty.map(f => (
              <tr key={f.id} className="hover:bg-slate-50/80">
                <td className="p-3.5 font-bold text-slate-900">{f.name}</td>
                <td className="p-3.5 text-slate-600 font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {f.email}</td>
                <td className="p-3.5 text-indigo-700 font-bold">{f.max_hours_per_day} hrs/day</td>
                <td className="p-3.5 text-purple-700 font-bold">{f.max_hours_per_week} hrs/week</td>
                <td className="p-3.5 text-slate-700 font-semibold">{f.available_days?.join(', ') || 'MON-FRI'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
