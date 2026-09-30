import React, { useState, useEffect } from 'react';
import { PlayCircle, ShieldCheck, AlertTriangle, ArrowRightLeft, Building2, Users } from 'lucide-react';
import { api } from '../services/api';
import { Timetable, Room, Faculty } from '../types';

export const SimulatorPage: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const [unavailableRoomId, setUnavailableRoomId] = useState('');
  const [unavailableFacId, setUnavailableFacId] = useState('');
  const [unavailableDay, setUnavailableDay] = useState(2); // Wed
  const [secCapSectionId, setSecCapSectionId] = useState('');
  const [secCapCount, setSecCapCount] = useState(70);

  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getTimetables(),
      api.getRooms(),
      api.getFaculty()
    ]).then(([ttList, rList, fList]) => {
      setTimetables(ttList);
      if (ttList.length > 0) setSelectedTimetableId(ttList[0].id);
      setRooms(rList);
      setFaculty(fList);
    });
  }, []);

  const handleRunSimulation = async () => {
    if (!selectedTimetableId) return;
    setSimulating(true);
    setSimResult(null);

    const scenario: any = {
      unavailable_room_ids: unavailableRoomId ? [unavailableRoomId] : [],
      unavailable_faculty_slots: unavailableFacId ? [{ faculty_id: unavailableFacId, day: unavailableDay, period: 1 }] : {},
      section_capacity_changes: secCapSectionId ? { [secCapSectionId]: secCapCount } : {}
    };

    try {
      const res = await api.simulateWhatIf(selectedTimetableId, scenario);
      setSimResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">What-If Simulation Sandbox</h2>
            <p className="text-xs text-slate-400">Simulate temporary institutional disruptions without altering production database state.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Target Timetable</label>
            <select
              value={selectedTimetableId}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
            >
              {timetables.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.academic_term})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario 1: Room Disruption */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> What if a room becomes unavailable?
              </h4>
              <select
                value={unavailableRoomId}
                onChange={(e) => setUnavailableRoomId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300"
              >
                <option value="">None (Select Room)</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>R{r.room_number} ({r.building})</option>
                ))}
              </select>
            </div>

            {/* Scenario 2: Faculty Disruption */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> What if a faculty is absent on Wednesday?
              </h4>
              <select
                value={unavailableFacId}
                onChange={(e) => setUnavailableFacId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300"
              >
                <option value="">None (Select Faculty)</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            {simulating ? 'Simulating Solver Delta...' : 'Execute What-If Simulation'}
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {simResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-200">Simulation Delta Outcome</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              simResult.feasible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {simResult.feasible ? 'FEASIBLE RE-SCHEDULABLE' : 'INFEASIBLE DISRUPTION'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Sessions Moved</span>
              <p className="text-lg font-bold text-purple-400 mt-1">{simResult.sessions_moved || 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Room Reassignments</span>
              <p className="text-lg font-bold text-amber-400 mt-1">{simResult.rooms_changed || 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">New Conflicts</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{simResult.new_conflicts_count || 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Sim Solver Time</span>
              <p className="text-lg font-bold text-indigo-400 mt-1">{simResult.solver_time_seconds || 0}s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
