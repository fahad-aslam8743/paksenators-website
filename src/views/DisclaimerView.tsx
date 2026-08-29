import React from 'react';
import { useYSP } from '../context/YSPContext';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerView: React.FC = () => {
  const { siteSettings } = useYSP();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <ShieldAlert className="w-10 h-10 text-amber-400" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Legal Notice</span>
        <h1 className="text-3xl font-extrabold">Institutional Disclaimer</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
        <p className="font-bold text-slate-900 text-sm">
          {siteSettings.legalDisclaimer}
        </p>
        <p>
          Youth Senate of Pakistan operates as an independent civic educational initiative aimed at nurturing youth leadership, parliamentary understanding, and democratic values across Pakistan.
        </p>
        <p>
          All information, statistics, and records presented on this platform are managed through official administrative CMS control.
        </p>
      </div>
    </div>
  );
};
