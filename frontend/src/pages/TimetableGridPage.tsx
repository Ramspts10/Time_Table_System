import React, { useEffect, useState } from 'react';
import {
  Calendar, Layers, Users, Building2, Download, CheckCircle2, AlertTriangle,
  Lock, Unlock, RefreshCw, Filter, ArrowRightLeft, ShieldAlert, Sparkles, Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { Timetable, TimetableEntry, Room } from '../types';

export const TimetableGridPage: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [viewMode, setViewMode] = useState<'SECTION' | 'FACULTY' | 'ROOM'>('SECTION');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDay, setEditDay] = useState(0);
  const [editPeriod, setEditPeriod] = useState(0);
  const [editRoomId, setEditRoomId] = useState('');
  const [editError, setEditError] = useState<any>(null);
  const [rippleProposal, setRippleProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const periods = [
    { idx: 0, label: 'P1 08:00-09:00' },
    { idx: 1, label: 'P2 09:00-10:00' },
    { idx: 2, label: 'P3 10:00-11:00' },
    { idx: 3, label: 'P4 11:00-12:00 (LUNCH)', isBreak: true },
    { idx: 4, label: 'P5 12:00-13:00' },
    { idx: 5, label: 'P6 13:00-14:00' },
    { idx: 6, label: 'P7 14:00-15:00' },
    { idx: 7, label: 'P8 15:00-16:00' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ttList, roomList] = await Promise.all([
        api.getTimetables(),
        api.getRooms()
      ]);
      setTimetables(ttList);
      setRooms(roomList);

      if (ttList.length > 0) {
        const detail = await api.getTimetable(ttList[0].id);
        setSelectedTimetable(detail);

        if (detail.entries && detail.entries.length > 0) {
          setSelectedFilter(detail.entries[0].section_name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTimetable = async (id: string) => {
    const detail = await api.getTimetable(id);
    setSelectedTimetable(detail);
  };

  const getFilterOptions = () => {
    if (!selectedTimetable?.entries) return [];
    const entries = selectedTimetable.entries;
    if (viewMode === 'SECTION') {
      return Array.from(new Set(entries.map(e => e.section_name)));
    } else if (viewMode === 'FACULTY') {
      return Array.from(new Set(entries.map(e => e.faculty_name)));
    } else {
      return Array.from(new Set(entries.map(e => e.room_name)));
    }
  };

  const filterOptions = getFilterOptions();

  const filteredEntries = (selectedTimetable?.entries || []).filter(e => {
    if (!selectedFilter) return true;
    if (viewMode === 'SECTION') return e.section_name === selectedFilter;
    if (viewMode === 'FACULTY') return e.faculty_name === selectedFilter;
    if (viewMode === 'ROOM') return e.room_name === selectedFilter;
    return true;
  });

  const getEntryAt = (dayIdx: number, periodIdx: number) => {
    return filteredEntries.find(e => e.day_index === dayIdx && e.period_index === periodIdx);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setEditDay(entry.day_index);
    setEditPeriod(entry.period_index);
    setEditRoomId(entry.room_id);
    setEditError(null);
    setRippleProposal(null);
    setEditModalOpen(true);
  };

  const checkSlotValidity = async (day: number, period: number, roomId: string) => {
    if (!selectedTimetable || !selectedEntry) return;
    try {
      const prop = await api.proposeOverride(selectedTimetable.id, selectedEntry.id, day, period, roomId);
      setRippleProposal(prop);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyManualEdit = async () => {
    if (!selectedTimetable || !selectedEntry) return;
    try {
      const res = await api.manualEditEntry(selectedTimetable.id, selectedEntry.id, editDay, editPeriod, editRoomId);
      if (res.success) {
        setEditModalOpen(false);
        const updated = await api.getTimetable(selectedTimetable.id);
        setSelectedTimetable(updated);
      } else {
        setEditError(res);
        checkSlotValidity(editDay, editPeriod, editRoomId);
      }
    } catch (err: any) {
      setEditError({ message: err.message || 'Edit failed' });
    }
  };

  const handleApplyRippleShift = async () => {
    if (!selectedTimetable || !selectedEntry) return;
    try {
      const res = await api.applyOverride(selectedTimetable.id, selectedEntry.id, editDay, editPeriod, editRoomId);
      if (res.success) {
        setEditModalOpen(false);
        const updated = await api.getTimetable(selectedTimetable.id);
        setSelectedTimetable(updated);
      } else {
        setEditError(res);
      }
    } catch (err: any) {
      setEditError({ message: err.message || 'Ripple shift failed' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Timetable Matrix...</div>;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTimetable?.id || ''}
            onChange={(e) => handleSelectTimetable(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            {timetables.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.academic_term})</option>
            ))}
          </select>

          {/* View Mode Buttons */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => { setViewMode('SECTION'); setSelectedFilter(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'SECTION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Section
            </button>
            <button
              onClick={() => { setViewMode('FACULTY'); setSelectedFilter(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'FACULTY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Faculty
            </button>
            <button
              onClick={() => { setViewMode('ROOM'); setSelectedFilter(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'ROOM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Room
            </button>
          </div>

          {/* Filter dropdown */}
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="">All {viewMode}s</option>
            {filterOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Exports & Status */}
        <div className="flex items-center gap-3">
          <a
            href={`/api/v1/export/${selectedTimetable?.id}/csv`}
            download
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" /> Export CSV
          </a>
          <a
            href={`/api/v1/export/${selectedTimetable?.id}/excel`}
            download
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
          </a>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-3 text-left font-bold text-slate-700 w-32 border-r border-slate-200">Period</th>
                {days.map(day => (
                  <th key={day} className="p-3 text-center font-black text-slate-800 uppercase tracking-wider min-w-[170px] border-r border-slate-200">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p.idx} className={`border-b border-slate-200 ${p.isBreak ? 'bg-amber-50/70' : 'hover:bg-slate-50/60'}`}>
                  <td className="p-3 font-bold text-slate-600 bg-slate-50 border-r border-slate-200 text-[11px]">
                    {p.label}
                  </td>
                  {days.map((day, dayIdx) => {
                    const entry = getEntryAt(dayIdx, p.idx);

                    if (p.isBreak) {
                      return (
                        <td key={dayIdx} className="p-2 border-r border-slate-200 text-center text-amber-800 font-bold bg-amber-50">
                          LUNCH BREAK
                        </td>
                      );
                    }

                    return (
                      <td key={dayIdx} className="p-2 border-r border-slate-200 vertical-top h-24">
                        {entry ? (
                          <div
                            onClick={() => openEditModal(entry)}
                            className={`h-full p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm group flex flex-col justify-between ${
                              entry.duration > 1
                                ? 'bg-purple-50/90 border-purple-200 hover:border-purple-400 text-purple-950'
                                : 'bg-indigo-50/90 border-indigo-200 hover:border-indigo-400 text-slate-900'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-extrabold text-indigo-900 text-xs">{entry.course_code}</span>
                                {entry.duration > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 border border-purple-300 text-[9px] font-bold">
                                    {entry.duration}h Lab
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 truncate" title={entry.course_name}>
                                {entry.course_name}
                              </p>
                            </div>

                            <div className="mt-2 text-[10px] text-slate-600 space-y-0.5 border-t border-slate-200/80 pt-1.5 font-medium">
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <Users className="w-3 h-3 text-indigo-600" /> {entry.section_name} • {entry.faculty_name}
                              </div>
                              <div className="flex items-center gap-1 text-slate-600">
                                <Building2 className="w-3 h-3 text-emerald-600" /> {entry.room_name}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                            FREE
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Reassign & Ripple Shift Modal */}
      {editModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Reassign & Ripple Shift Override
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-indigo-900">{selectedEntry.course_code} - {selectedEntry.course_name}</p>
              <p className="text-slate-600 font-medium">Section: <span className="text-slate-900 font-bold">{selectedEntry.section_name}</span> | Faculty: <span className="text-slate-900 font-bold">{selectedEntry.faculty_name}</span></p>
            </div>

            {/* Validation Error Banner */}
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1 text-rose-700"><ShieldAlert className="w-4 h-4" /> Direct Assignment Conflict Detected</p>
                {editError.conflicts?.map((c: any, i: number) => (
                  <p key={i} className="text-[11px] font-semibold text-rose-800">• {c.message}</p>
                ))}
              </div>
            )}

            {/* AI Ripple Shift Proposal Banner */}
            {rippleProposal && rippleProposal.conflict_detected && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> AI Ripple Shift Recommendation Available
                </div>
                {rippleProposal.conflicting_session && (
                  <p className="text-slate-700 font-medium">
                    Target slot currently occupied by <span className="font-bold text-slate-900">{rippleProposal.conflicting_session.course_code}</span>.
                  </p>
                )}
                {rippleProposal.recommended_shifts?.map((s: any, idx: number) => (
                  <p key={idx} className="text-[11px] font-bold text-indigo-700 bg-white p-2 rounded-lg border border-indigo-200">
                    ↳ Recommend moving <span className="text-purple-700">{s.course_code}</span> to Day {days[s.to.day_index]} Period P{s.to.period_index + 1}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Target Day</label>
                <select
                  value={editDay}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setEditDay(d);
                    checkSlotValidity(d, editPeriod, editRoomId);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold"
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Target Period</label>
                <select
                  value={editPeriod}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setEditPeriod(p);
                    checkSlotValidity(editDay, p, editRoomId);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold"
                >
                  {periods.filter(p => !p.isBreak).map(p => (
                    <option key={p.idx} value={p.idx}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Target Room</label>
                <select
                  value={editRoomId}
                  onChange={(e) => {
                    const r = e.target.value;
                    setEditRoomId(r);
                    checkSlotValidity(editDay, editPeriod, r);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>R{r.room_number} ({r.building}) - Cap: {r.capacity} [{r.room_type}]</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              {rippleProposal?.can_override && rippleProposal?.recommended_shifts?.length > 0 && (
                <button
                  onClick={handleApplyRippleShift}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Apply AI Ripple Shift
                </button>
              )}

              <button
                onClick={handleApplyManualEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Direct Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
