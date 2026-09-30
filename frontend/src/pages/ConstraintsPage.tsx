import React, { useEffect, useState } from 'react';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { ConstraintRules } from '../types';

export const ConstraintsPage: React.FC = () => {
  const [rules, setRules] = useState<ConstraintRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getConstraints().then(res => setRules(res)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!rules) return;
    try {
      await api.updateConstraints(rules);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !rules) return <div className="p-8 text-center text-slate-500 font-medium">Loading Constraint Rules...</div>;

  const weightsList: { key: keyof ConstraintRules; label: string; desc: string }[] = [
    { key: 'faculty_gaps_weight', label: 'Faculty Gaps Penalty', desc: 'Penalizes empty periods between classes for a faculty member.' },
    { key: 'student_gaps_weight', label: 'Student Gaps Penalty', desc: 'Penalizes idle periods for students between scheduled courses.' },
    { key: 'room_capacity_waste_weight', label: 'Room Capacity Waste Penalty', desc: 'Penalizes assigning a large room (e.g., cap 100) to a small section (e.g., 30 students).' },
    { key: 'room_changes_weight', label: 'Section Room Changes Penalty', desc: 'Penalizes sections switching classrooms multiple times on the same day.' },
    { key: 'undesirable_periods_weight', label: 'Undesirable Periods Penalty', desc: 'Penalizes scheduling courses outside preferred daily period slots.' },
    { key: 'preference_violations_weight', label: 'Preference Violation Weight', desc: 'Penalizes violating faculty room & period preferences.' },
    { key: 'workload_imbalance_weight', label: 'Workload Imbalance Weight', desc: 'Penalizes uneven distribution of teaching hours across working days.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">CP-SAT Soft Constraint Weights Configuration</h2>
              <p className="text-xs text-slate-500 font-medium">Tune objective penalty weights used by the CP-SAT optimization model.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Weights
          </button>
        </div>

        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Soft constraint weights updated successfully.
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-slate-100">
          {weightsList.map(w => (
            <div key={w.key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{w.label}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{w.desc}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={rules[w.key]}
                  onChange={(e) => setRules({ ...rules, [w.key]: Number(e.target.value) })}
                  className="w-32 accent-indigo-600"
                />
                <span className="w-10 text-center font-black text-indigo-700 text-sm bg-white py-1 px-2 rounded-lg border border-slate-200 shadow-sm">
                  {rules[w.key]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
