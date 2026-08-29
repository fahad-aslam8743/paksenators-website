import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Resolution } from '../types/ysp';
import { FileText, CheckCircle2 } from 'lucide-react';

export const ResolutionsView: React.FC = () => {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);

  useEffect(() => {
    fetchApi<Resolution[]>('/resolutions').then(setResolutions).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Passed Motions</span>
        <h1 className="text-3xl font-extrabold">Youth Senate Resolutions</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Official resolutions moved, debated, and passed during Youth Senate parliamentary sittings.
        </p>
      </div>

      <div className="space-y-4">
        {resolutions.map(res => (
          <div key={res.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-900 text-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded uppercase">
                {res.resolutionNumber}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Status: {res.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{res.title}</h3>
            <p className="text-xs text-slate-500">Mover: {res.moverName} | Submitted: {res.dateSubmitted}</p>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded border leading-relaxed">{res.text}</p>
            {res.outcome && (
              <div className="text-xs text-emerald-900 font-bold bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Outcome: {res.outcome}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
