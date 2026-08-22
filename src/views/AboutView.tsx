import React from 'react';
import { useYSP } from '../context/YSPContext';
import { Landmark, ShieldCheck, Award, Flag, Users, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { MunPromoBanner } from '../components/MunPromoBanner';

export const AboutView: React.FC = () => {
  const { siteSettings, t, navigate } = useYSP();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">
      
      {/* Header Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 md:p-12 border-b-4 border-amber-500 space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Institutional Mandate</span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">About Youth Senate of Pakistan</h1>
        <p className="text-emerald-100/90 text-sm md:text-base max-w-3xl leading-relaxed">
          Youth Senate of Pakistan is an independent, non-partisan national youth parliamentary platform. We provide Pakistani youth with structured exposure to parliamentary procedures, democratic dialogue, policy writing, and civic engagement.
        </p>
      </div>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold text-amber-600 uppercase">Strategic Direction</span>
          <h2 className="text-2xl font-bold text-slate-900">{t('visionTitle')}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{siteSettings.visionStatement}</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase">Core Purpose</span>
          <h2 className="text-2xl font-bold text-slate-900">{t('missionTitle')}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{siteSettings.missionStatement}</p>
        </div>
      </div>

      <MunPromoBanner />

      {/* Core Values */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Ethical Foundation</span>
          <h2 className="text-2xl font-bold text-slate-900">Our Core Values</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            'Democracy & Rule of Law',
            'Integrity & Transparency',
            'Inclusion & Youth Equity',
            'Civic Responsibility',
            'Constructive Debate',
            'National Unity & Harmony',
            'Accountability',
            'Community Service'
          ].map((val, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 text-center font-bold text-xs text-slate-800 shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="bg-emerald-900 text-white p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-2xl font-bold">Ready to Join Pakistan's Parliamentary Movement?</h3>
        <p className="text-xs text-emerald-100 max-w-xl mx-auto">
          Submit your membership application online to represent your district in Youth Senate of Pakistan.
        </p>
        <button
          onClick={() => navigate('apply')}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase rounded-lg shadow-lg"
        >
          {t('navJoinYSP')}
        </button>
      </div>

    </div>
  );
};
