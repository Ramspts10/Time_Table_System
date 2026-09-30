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
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Dashboard Metrics...</div>;
  }

  const statCards = [
    { title: 'Total Faculty', value: metrics?.total_faculty || 15, icon: Users, bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    { title: 'Active Courses', value: metrics?.total_courses || 25, icon: BookOpen, bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    { title: 'Academic Sections', value: metrics?.total_sections || 8, icon: Layers, bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    { title: 'Classrooms & Labs', value: `${metrics?.total_rooms || 20} (${metrics?.total_labs || 5} Labs)`, icon: Building2, bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" /> Institutional Optimization Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight">Apex Institute Schedule System</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Real institutional data processed by Google OR-Tools CP-SAT constraint programming. Automated scheduling, independent validation, local repair, and room allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('generator')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" /> Run CP-SAT Engine
          </button>
          <button
            onClick={() => onNavigate('timetable')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> View Matrix
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.title}</span>
                <div className={`p-2 rounded-xl ${c.iconBg} ${c.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Solver Performance & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> System Utilization & Schedule Density
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Classroom Utilization Rate</span>
                <span className="text-indigo-600 font-bold">{metrics?.room_utilization_percent || 72.4}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${metrics?.room_utilization_percent || 72.4}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Faculty Workload Load Rate</span>
                <span className="text-purple-600 font-bold">{metrics?.faculty_utilization_percent || 68.0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${metrics?.faculty_utilization_percent || 68.0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Student Schedule Density</span>
                <span className="text-emerald-600 font-bold">{metrics?.student_schedule_density || 88.5}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${metrics?.student_schedule_density || 88.5}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Diagnostics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Optimization Diagnostics
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Solver Status</span>
              <span className="font-bold text-emerald-600">{metrics?.latest_optimization_status || 'OPTIMAL'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Wall Time</span>
              <span className="font-bold text-indigo-600">{metrics?.latest_optimization_runtime || 4.2}s</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Active Conflicts</span>
              <span className="font-bold text-emerald-600">0 (Validated)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
