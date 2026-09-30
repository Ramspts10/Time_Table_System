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

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Faculty Roster...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">Institutional Faculty Roster</h2>
            <p className="text-xs text-slate-400">Manage faculty workload limits, availability slots, and preferences.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">Total: {faculty.length}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <th className="p-3">Faculty Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Max Daily Hours</th>
              <th className="p-3">Max Weekly Hours</th>
              <th className="p-3">Working Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {faculty.map(f => (
              <tr key={f.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-slate-200">{f.name}</td>
                <td className="p-3 text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {f.email}</td>
                <td className="p-3 text-indigo-400 font-semibold">{f.max_hours_per_day} hrs/day</td>
                <td className="p-3 text-purple-400 font-semibold">{f.max_hours_per_week} hrs/week</td>
                <td className="p-3 text-slate-300">{f.available_days?.join(', ') || 'MON-FRI'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
