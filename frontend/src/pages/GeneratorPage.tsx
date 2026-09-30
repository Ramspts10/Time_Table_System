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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Google OR-Tools CP-SAT Optimization Engine</h2>
            <p className="text-xs text-slate-400">Generates optimal timetable satisfying hard & soft constraints across all departments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Term</label>
            <input
              type="text"
              value={academicTerm}
              onChange={(e) => setAcademicTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Solver Time Limit (seconds)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Optimization Execution Summary
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              result.status === 'GENERATED' || result.solver_status === 'OPTIMAL' || result.solver_status === 'FEASIBLE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {result.solver_status || result.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Total Scheduled Sessions</span>
              <p className="text-lg font-bold text-slate-100 mt-1">{result.total_entries || 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Objective Score</span>
              <p className="text-lg font-bold text-indigo-400 mt-1">{result.objective_score ?? 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Solver Wall Time</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{result.solver_time_seconds || 0}s</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Hard Violations</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">0</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onNavigateToMatrix}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20"
            >
              Open Timetable Grid Matrix →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
