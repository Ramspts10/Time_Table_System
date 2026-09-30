import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw, Wrench } from 'lucide-react';
import { api } from '../services/api';
import { Timetable, ValidationResult } from '../types';

export const ConflictCenterPage: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [valResult, setValResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getTimetables().then(list => {
      setTimetables(list);
      if (list.length > 0) {
        setSelectedTimetableId(list[0].id);
        runValidation(list[0].id);
      }
    });
  }, []);

  const runValidation = async (id: string) => {
    setLoading(true);
    setRepairMsg(null);
    try {
      const res = await api.validateTimetable(id);
      setValResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRepair = async () => {
    if (!selectedTimetableId) return;
    setRepairing(true);
    setRepairMsg(null);
    try {
      const res = await api.repairTimetable(selectedTimetableId, {});
      setRepairMsg(`Local Repair Engine: ${res.repaired ? 'Successfully repaired' : 'No conflicts'} (${res.sessions_moved} sessions moved).`);
      runValidation(selectedTimetableId);
    } catch (err: any) {
      setRepairMsg(`Repair failed: ${err.message}`);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Independent Conflict & Validation Center</h2>
              <p className="text-xs text-slate-400">Verifies faculty, section, room, equipment, and capacity constraints independently of solver.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTimetableId}
              onChange={(e) => { setSelectedTimetableId(e.target.value); runValidation(e.target.value); }}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
            >
              {timetables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => runValidation(selectedTimetableId)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status banner */}
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs">Running independent validation engine...</div>
        ) : valResult ? (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            valResult.is_valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {valResult.is_valid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              <div>
                <h4 className="font-bold text-sm">
                  {valResult.is_valid ? 'TIMETABLE VALIDATED - 0 CONFLICTS' : `INFEASIBLE - ${valResult.total_conflicts} CONFLICTS DETECTED`}
                </h4>
                <p className="text-xs text-slate-400">
                  {valResult.is_valid ? 'All hard constraints (Faculty non-overlap, Section non-overlap, Room capacity, Lab equipment) verified.' : 'Conflict explainer details listed below.'}
                </p>
              </div>
            </div>

            {!valResult.is_valid && (
              <button
                onClick={handleTriggerRepair}
                disabled={repairing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Wrench className="w-4 h-4" /> Trigger Local Repair
              </button>
            )}
          </div>
        ) : null}

        {repairMsg && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-medium">
            {repairMsg}
          </div>
        )}

        {/* Detailed Errors List */}
        {valResult && valResult.errors.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Conflict Diagnostic Log</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {valResult.errors.map((err, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-lg border border-rose-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">{err.code}</span>
                  </div>
                  <p className="text-slate-300">{err.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
