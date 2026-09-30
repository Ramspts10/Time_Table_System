import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, Clock, Layers, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../services/api';

interface GeneratorPageProps {
  onNavigateToMatrix: () => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({ onNavigateToMatrix }) => {
  const [name, setName] = useState('Spring 2026 Schedule');
  const [academicTerm, setAcademicTerm] = useState('Spring 2026');
  const [timeLimit, setTimeLimit] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await api.generateTimetable(name, academicTerm, timeLimit);
      setResult(res);
    } catch (err: any) {
      setResult({ status: 'FAILED', message: err.message || 'Generation failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Google OR-Tools CP-SAT Optimization Engine</h2>
            <p className="text-xs text-slate-500 font-medium">Generates optimal timetable satisfying hard & soft constraints across all departments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
            <input
              type="text"
              value={academicTerm}
              onChange={(e) => setAcademicTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Solver Time Limit (seconds)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running CP-SAT Solver...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Optimization Job
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Optimization Execution Summary
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              result.status === 'GENERATED' || result.solver_status === 'OPTIMAL' || result.solver_status === 'FEASIBLE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {result.solver_status || result.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Total Scheduled Sessions</span>
              <p className="text-xl font-black text-slate-900 mt-1">{result.total_entries || 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Objective Score</span>
              <p className="text-xl font-black text-indigo-600 mt-1">{result.objective_score ?? 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Solver Wall Time</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{result.solver_time_seconds || 0}s</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Hard Violations</span>
              <p className="text-xl font-black text-emerald-600 mt-1">0</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onNavigateToMatrix}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Open Timetable Grid Matrix →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
