import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Building2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { Timetable } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTtId, setSelectedTtId] = useState('');
  const [roomData, setRoomData] = useState<any[]>([]);
  const [facultyData, setFacultyData] = useState<any[]>([]);

  useEffect(() => {
    api.getTimetables().then(list => {
      setTimetables(list);
      if (list.length > 0) {
        setSelectedTtId(list[0].id);
        loadAnalytics(list[0].id);
      }
    });
  }, []);

  const loadAnalytics = async (ttId: string) => {
    try {
      const [rRes, fRes] = await Promise.all([
        api.getRoomAnalytics(ttId),
        api.getFacultyAnalytics(ttId)
      ]);
      setRoomData(rRes.room_analytics || []);
      setFacultyData(fRes.faculty_analytics || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">Institutional Analytics & Metrics</h2>
            <p className="text-xs text-slate-400">Classroom utilization rate, peak load, and faculty teaching load analysis.</p>
          </div>
        </div>

        <select
          value={selectedTtId}
          onChange={(e) => { setSelectedTtId(e.target.value); loadAnalytics(e.target.value); }}
          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
        >
          {timetables.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" /> Room Utilization Rates (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="room_name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="utilization_percent" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Workload Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Faculty Weekly Teaching Hours
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="faculty_name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="assigned_hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
