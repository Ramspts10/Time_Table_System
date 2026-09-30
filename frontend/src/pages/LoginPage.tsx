import React, { useState } from 'react';
import { ShieldCheck, Cpu, KeyRound, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: { role: string; full_name: string; token: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@apex.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      onLoginSuccess({
        role: res.role,
        full_name: res.full_name,
        token: res.access_token
      });
    } catch (err: any) {
      setError('Invalid credentials. Run seed data if database is empty.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/30">
            ST
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Smart Timetable System</h1>
          <p className="text-xs text-slate-400">Classroom Allocation & CP-SAT Optimization Platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : <>Sign In to Portal <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">Quick Demo Login Shortcuts</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button onClick={() => handleQuickLogin('admin@apex.edu')} className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800 font-medium">
              Admin
            </button>
            <button onClick={() => handleQuickLogin('hod.cse@apex.edu')} className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800 font-medium">
              HOD CSE
            </button>
            <button onClick={() => handleQuickLogin('alan.turing@apex.edu')} className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800 font-medium">
              Faculty
            </button>
            <button onClick={() => handleQuickLogin('student.cse@apex.edu')} className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800 font-medium">
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
