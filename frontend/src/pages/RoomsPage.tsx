import React, { useEffect, useState } from 'react';
import { Building2, Cpu, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Room } from '../types';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRooms().then(res => setRooms(res)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Rooms & Laboratories...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">Classrooms & Specialized Laboratories</h2>
            <p className="text-xs text-slate-400">Room capacities, building locations, room types, and equipped specialized hardware.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">Total: {rooms.length} Rooms</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-100">R{r.room_number}</h3>
                <p className="text-xs text-slate-400">{r.building} • Floor {r.floor}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                r.room_type.includes('LAB') ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}>
                {r.room_type}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">Seating Capacity</span>
              <span className="font-bold text-emerald-400 text-sm">{r.capacity} seats</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Equipped Hardware</span>
              <div className="flex flex-wrap gap-1">
                {r.equipment?.map((eq, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-800 text-[9px] font-semibold">
                    {eq}
                  </span>
                )) || <span className="text-slate-600 text-[10px]">Standard</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
