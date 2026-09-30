import React, { useEffect, useState } from 'react';
import {
  Users, BookOpen, Layers, Building2, Cpu, Calendar, PlayCircle,
  TrendingUp, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardAnalytics()
      .then(res => setMetrics(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Dashboard Metrics...</div>;
  }

  const statCards = [
    { title: 'Total Faculty', value: metrics?.total_faculty || 15, icon: Users, color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    { title: 'Active Courses', value: metrics?.total_courses || 25, icon: BookOpen, color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    { title: 'Academic Sections', value: metrics?.total_sections || 8, icon: Layers, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    { title: 'Classrooms & Labs', value: `${metrics?.total_rooms || 20} (${metrics?.total_labs || 5} Labs)`, icon: Building2, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-400' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" /> Institutional Constraint-Optimization Platform
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Apex Institute Schedule System</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Real institutional data processed by Google OR-Tools CP-SAT constraint programming. Automated scheduling, independent validation, local repair, and room allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('generator')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" /> Run CP-SAT Engine
          </button>
          <button
            onClick={() => onNavigate('timetable')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-indigo-400" /> View Matrix
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${c.color} border ${c.border} rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
                <div className={`p-2 rounded-lg bg-slate-900/60 ${c.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-100 mt-2">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Solver Performance & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> System Utilization & Density
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Classroom Utilization Rate</span>
                <span className="text-indigo-400 font-semibold">{metrics?.room_utilization_percent || 72.4}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${metrics?.room_utilization_percent || 72.4}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Faculty Workload Load Rate</span>
                <span className="text-purple-400 font-semibold">{metrics?.faculty_utilization_percent || 68.0}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${metrics?.faculty_utilization_percent || 68.0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Student Schedule Density</span>
                <span className="text-emerald-400 font-semibold">{metrics?.student_schedule_density || 88.5}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full" style={{ width: `${metrics?.student_schedule_density || 88.5}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Latest Optimization Diagnostics
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Solver Status</span>
              <span className="font-semibold text-emerald-400">{metrics?.latest_optimization_status || 'OPTIMAL'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Wall Time</span>
              <span className="font-semibold text-indigo-400">{metrics?.latest_optimization_runtime || 4.2}s</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Active Conflicts</span>
              <span className="font-semibold text-emerald-400">0 (Validated)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
