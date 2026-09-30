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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              ST
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm leading-tight">Smart Timetable</h1>
              <p className="text-xs text-indigo-400 font-medium">OR-Tools CP-SAT Engine</p>
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-indigo-400">
                {userName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Apex Institute</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-slate-200 capitalize">{currentTab.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CP-SAT Engine Active
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};
