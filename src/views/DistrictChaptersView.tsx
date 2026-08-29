import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { DistrictChapter } from '../types/ysp';
import { MapPin, Users, Building2 } from 'lucide-react';

export const DistrictChaptersView: React.FC = () => {
  const { navigate, currentViewParam } = useYSP();
  const [chapters, setChapters] = useState<DistrictChapter[]>([]);

  useEffect(() => {
    fetchApi<DistrictChapter[]>('/chapters').then(setChapters).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Grassroots Representation</span>
        <h1 className="text-3xl font-extrabold">District Chapters</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Youth Senate of Pakistan chapters operate across districts in KP, Punjab, Sindh, Balochistan, ICT, GB, and AJK.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters.map(chap => (
          <div key={chap.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {chap.presidentPhotoUrl && (
              <div className="h-40 w-full bg-slate-100">
                <img
                  src={chap.presidentPhotoUrl}
                  alt={chap.presidentName || chap.name}
                  className="w-full h-full object-cover object-[center_15%]"
                />
              </div>
            )}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {chap.status} Chapter
                </span>
                <span className="text-xs font-semibold text-slate-500">{chap.senatorCount} Senators</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{chap.name}</h3>
              <p className="text-xs text-amber-700 font-semibold">{chap.province}</p>
              <p className="text-xs text-slate-600">{chap.description}</p>
              {chap.presidentName && (
                <div className="pt-2 border-t text-xs text-slate-500">
                  President: <strong className="text-slate-800">{chap.presidentName}</strong>
                </div>
              )}
              {chap.coordinatorName && (
                <div className="text-xs text-slate-500">
                  Coordinator: <strong className="text-slate-800">{chap.coordinatorName}</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
