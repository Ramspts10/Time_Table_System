import React, { useEffect, useState } from 'react';
import { Layers, GraduationCap, Users } from 'lucide-react';
import { api } from '../services/api';
import { Section } from '../types';

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSections().then(res => setSections(res)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Student Sections...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">Academic Sections Directory</h2>
            <p className="text-xs text-slate-400">Student section sizes, programs, and semester configurations.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">Total Sections: {sections.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-emerald-400">{s.name}</h3>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">Sem {s.semester}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{s.program}</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-500" /> Student Count</span>
              <span className="font-bold text-slate-100">{s.student_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
