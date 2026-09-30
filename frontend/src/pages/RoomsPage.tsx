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

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Rooms & Laboratories...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Classrooms & Specialized Laboratories</h2>
            <p className="text-xs text-slate-500 font-medium">Room capacities, building locations, room types, and equipped specialized hardware.</p>
          </div>
        </div>
        <span className="px-3.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">Total: {rooms.length} Rooms</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(r => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-base text-slate-900">R{r.room_number}</h3>
                <p className="text-xs text-slate-500 font-medium">{r.building} • Floor {r.floor}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                r.room_type.includes('LAB') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {r.room_type}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 font-semibold">
              <span className="text-slate-500">Seating Capacity</span>
              <span className="font-black text-emerald-700 text-sm">{r.capacity} seats</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Equipped Hardware</span>
              <div className="flex flex-wrap gap-1">
                {r.equipment?.map((eq, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-[9px] font-bold">
                    {eq}
                  </span>
                )) || <span className="text-slate-400 text-[10px] font-medium">Standard</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
