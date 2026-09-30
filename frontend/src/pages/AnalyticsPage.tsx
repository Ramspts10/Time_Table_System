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
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Institutional Analytics & Metrics</h2>
            <p className="text-xs text-slate-500 font-medium">Classroom utilization rate, peak load, and faculty teaching load analysis.</p>
          </div>
        </div>

        <select
          value={selectedTtId}
          onChange={(e) => { setSelectedTtId(e.target.value); loadAnalytics(e.target.value); }}
          className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-800 font-semibold"
        >
          {timetables.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Room Utilization Rates (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="room_name" stroke="#64748b" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="utilization_percent" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Workload Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Faculty Weekly Teaching Hours
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="faculty_name" stroke="#64748b" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="assigned_hours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
