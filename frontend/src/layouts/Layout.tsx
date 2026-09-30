import React from 'react';
import {
  Calendar, LayoutDashboard, Users, BookOpen, Layers, Building2, Clock,
  Sliders, Cpu, AlertTriangle, PlayCircle, BarChart3, LogOut, CheckCircle2, ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: string;
  userName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  userName,
  onLogout,
  children
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
    { id: 'timetable', label: 'Timetable Matrix', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
    { id: 'generator', label: 'CP-SAT Generator', icon: Cpu, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'simulator', label: 'What-If Simulator', icon: PlayCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'conflicts', label: 'Conflict Center', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'faculty', label: 'Faculty Roster', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'courses', label: 'Courses & Labs', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'sections', label: 'Sections', icon: Layers, roles: ['SUPER_ADMIN', 'ADMIN', 'HOD'] },
    { id: 'rooms', label: 'Classrooms & Labs', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'constraints', label: 'Constraint Rules', icon: Sliders, roles: ['SUPER_ADMIN', 'ADMIN'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-200">
              ST
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">Smart Timetable</h1>
              <p className="text-xs text-indigo-600 font-medium">OR-Tools CP-SAT</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {filteredItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                {userName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-100 text-indigo-700">
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white/80 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">Apex Institute</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 capitalize">{currentTab.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CP-SAT Active
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};
