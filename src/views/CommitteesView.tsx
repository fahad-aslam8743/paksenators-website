import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Committee } from '../types/ysp';
import { ChevronRight, Users, Calendar } from 'lucide-react';

export const CommitteesView: React.FC = () => {
  const { navigate, currentViewParam } = useYSP();
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    fetchApi<Committee[]>('/committees').then(setCommittees).catch(console.warn);
  }, []);

  // If a specific committee ID parameter is present, show detail view
  if (currentViewParam) {
    const selected = committees.find(c => c.id === currentViewParam);
    if (selected) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
          <button
            onClick={() => navigate('committees')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            ← Back to All Committees
          </button>

          {/* Large chairperson banner photo with name below, at the very top
              of the committee detail page — the small circular photo stays
              on the committee list/cards view (unchanged, further below). */}
          {selected.chairpersonPhotoUrl ? (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-emerald-950">
              <img
                src={selected.chairpersonPhotoUrl}
                alt={selected.chairpersonName}
                className="w-full h-full object-cover object-[center_15%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Chairperson</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">{selected.chairpersonName}</h2>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-emerald-950 border-2 border-dashed border-emerald-800 p-8 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl">
                {selected.chairpersonName?.charAt(0) || '?'}
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Chairperson</span>
                <h2 className="text-xl font-extrabold text-white">{selected.chairpersonName}</h2>
              </div>
            </div>
          )}

          <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{selected.code}</span>
            <h1 className="text-2xl md:text-4xl font-extrabold">{selected.name}</h1>
            <p className="text-emerald-100 text-sm max-w-3xl">{selected.mandate}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Key Objectives & Scope</h3>
                {selected.objectives && selected.objectives.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-2">
                    {selected.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No objectives listed yet for this committee.</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Meeting Schedule & Rules</h3>
                <p className="text-xs text-slate-600">{selected.meetingSchedule}</p>
              </div>
            </div>

            <div className="bg-emerald-950 text-white p-6 rounded-2xl border-t-4 border-amber-400 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-amber-300 uppercase">Committee Details</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-emerald-300">Active Members:</span>
                  <p className="font-bold text-white text-sm">{selected.memberCount} Senators</p>
                </div>
                {selected.viceChairpersonName && (
                  <div>
                    <span className="text-emerald-300">Vice Chairperson:</span>
                    <p className="font-bold text-white text-sm">{selected.viceChairpersonName}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('apply')}
                className="w-full py-2.5 bg-amber-500 text-emerald-950 font-bold text-xs uppercase rounded text-center hover:bg-amber-400"
              >
                Apply for Committee
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Policy Framework</span>
        <h1 className="text-3xl font-extrabold">Standing Committees</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Standing committees formulate policy proposals, review youth legislation, and conduct specialized inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map(com => (
          <div key={com.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase">{com.code}</span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                {com.memberCount} Members
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{com.name}</h3>
            <p className="text-xs text-slate-600 line-clamp-3">{com.mandate}</p>
            <div className="flex items-center gap-2 pt-1">
              {com.chairpersonPhotoUrl ? (
                <img
                  src={com.chairpersonPhotoUrl}
                  alt={com.chairpersonName}
                  className="w-9 h-9 rounded-full object-cover object-[center_15%] border border-emerald-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                  {com.chairpersonName?.charAt(0) || '?'}
                </div>
              )}
              <div className="text-xs">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Chairperson</p>
                <p className="text-slate-700 font-semibold">{com.chairpersonName}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => navigate('committees', com.id)}
                className="font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-0.5"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
