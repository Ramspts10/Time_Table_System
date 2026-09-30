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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Independent Conflict & Validation Center</h2>
              <p className="text-xs text-slate-500 font-medium">Verifies faculty, section, room, equipment, and capacity constraints independently of solver.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTimetableId}
              onChange={(e) => { setSelectedTimetableId(e.target.value); runValidation(e.target.value); }}
              className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
            >
              {timetables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => runValidation(selectedTimetableId)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status banner */}
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-xs font-medium">Running independent validation engine...</div>
        ) : valResult ? (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            valResult.is_valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              {valResult.is_valid ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-rose-600" />}
              <div>
                <h4 className="font-bold text-sm">
                  {valResult.is_valid ? 'TIMETABLE VALIDATED - 0 CONFLICTS' : `INFEASIBLE - ${valResult.total_conflicts} CONFLICTS DETECTED`}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {valResult.is_valid ? 'All hard constraints (Faculty non-overlap, Section non-overlap, Room capacity, Lab equipment) verified.' : 'Conflict explainer details listed below.'}
                </p>
              </div>
            </div>

            {!valResult.is_valid && (
              <button
                onClick={handleTriggerRepair}
                disabled={repairing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Wrench className="w-4 h-4" /> Trigger Local Repair
              </button>
            )}
          </div>
        ) : null}

        {repairMsg && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-bold">
            {repairMsg}
          </div>
        )}

        {/* Detailed Errors List */}
        {valResult && valResult.errors.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Conflict Diagnostic Log</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {valResult.errors.map((err, i) => (
                <div key={i} className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700">{err.code}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{err.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
