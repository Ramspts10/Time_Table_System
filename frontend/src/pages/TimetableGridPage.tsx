import React, { useEffect, useState } from 'react';
import {
  Calendar, Layers, Users, Building2, Download, CheckCircle2, AlertTriangle,
  Lock, Unlock, RefreshCw, Filter, ArrowRightLeft, ShieldAlert
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

  // Filter options based on view mode
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

  // Filter entries
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
    setEditModalOpen(true);
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
      }
    } catch (err: any) {
      setEditError({ message: err.message || 'Edit failed' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Timetable Matrix...</div>;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTimetable?.id || ''}
            onChange={(e) => handleSelectTimetable(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {timetables.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.academic_term})</option>
            ))}
          </select>

          {/* View Mode Buttons */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('SECTION'); setSelectedFilter(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'SECTION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Section
            </button>
            <button
              onClick={() => { setViewMode('FACULTY'); setSelectedFilter(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'FACULTY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Faculty
            </button>
            <button
              onClick={() => { setViewMode('ROOM'); setSelectedFilter(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'ROOM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Room
            </button>
          </div>

          {/* Filter dropdown */}
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
          </a>
          <a
            href={`/api/v1/export/${selectedTimetable?.id}/excel`}
            download
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
          </a>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="p-3 text-left font-semibold text-slate-400 w-32 border-r border-slate-800">Period</th>
                {days.map(day => (
                  <th key={day} className="p-3 text-center font-bold text-slate-200 uppercase tracking-wider min-w-[170px] border-r border-slate-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p.idx} className={`border-b border-slate-800/80 ${p.isBreak ? 'bg-amber-500/5' : 'hover:bg-slate-800/30'}`}>
                  <td className="p-3 font-semibold text-slate-400 bg-slate-950/40 border-r border-slate-800 text-[11px]">
                    {p.label}
                  </td>
                  {days.map((day, dayIdx) => {
                    const entry = getEntryAt(dayIdx, p.idx);

                    if (p.isBreak) {
                      return (
                        <td key={dayIdx} className="p-2 border-r border-slate-800 text-center text-amber-500/60 font-semibold bg-amber-500/5">
                          LUNCH BREAK
                        </td>
                      );
                    }

                    return (
                      <td key={dayIdx} className="p-2 border-r border-slate-800 vertical-top h-24">
                        {entry ? (
                          <div
                            onClick={() => openEditModal(entry)}
                            className="h-full p-2.5 rounded-lg bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer shadow-md group relative flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-indigo-300 text-xs">{entry.course_code}</span>
                                {entry.duration > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
                                    {entry.duration}h Lab
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium text-slate-200 truncate" title={entry.course_name}>
                                {entry.course_name}
                              </p>
                            </div>

                            <div className="mt-2 text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5">
                              <div className="flex items-center gap-1 font-medium text-slate-300">
                                <Users className="w-3 h-3 text-indigo-400" /> {entry.section_name} • {entry.faculty_name}
                              </div>
                              <div className="flex items-center gap-1 text-slate-400">
                                <Building2 className="w-3 h-3 text-emerald-400" /> {entry.room_name}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-lg border border-dashed border-slate-800/50 flex items-center justify-center text-[10px] text-slate-600 font-medium">
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

      {/* Edit / Reassign Modal */}
      {editModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" /> Manual Reassign Session
            </h3>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-indigo-300">{selectedEntry.course_code} - {selectedEntry.course_name}</p>
              <p className="text-slate-400">Section: <span className="text-slate-200">{selectedEntry.section_name}</span> | Faculty: <span className="text-slate-200">{selectedEntry.faculty_name}</span></p>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Validation Failed</p>
                <p>{editError.message}</p>
                {editError.conflicts?.map((c: any, i: number) => (
                  <p key={i} className="text-[11px] text-rose-400">• {c.message}</p>
                ))}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Day</label>
                <select
                  value={editDay}
                  onChange={(e) => setEditDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Period</label>
                <select
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  {periods.filter(p => !p.isBreak).map(p => (
                    <option key={p.idx} value={p.idx}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Room</label>
                <select
                  value={editRoomId}
                  onChange={(e) => setEditRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>R{r.room_number} ({r.building}) - Cap: {r.capacity} [{r.room_type}]</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyManualEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Validate & Save Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
