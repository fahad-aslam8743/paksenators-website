import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { Landmark, Mail, Quote, ShieldCheck } from 'lucide-react';
import { fetchApi, getCached } from '../lib/api';
import { LeadershipMember } from '../types/ysp';

function pickFounder(list: LeadershipMember[]): LeadershipMember | null {
  return list.find(l => l.category === 'Founder Chairman' || l.name.includes('Irfan Mateen')) || null;
}

export const FounderChairmanView: React.FC = () => {
  const { navigate } = useYSP();
  const [founder, setFounder] = useState<LeadershipMember | null>(
    () => pickFounder(getCached<LeadershipMember[]>('/leadership') || [])
  );

  useEffect(() => {
    fetchApi<LeadershipMember[]>('/leadership').then(list => {
      const fc = pickFounder(list);
      if (fc) setFounder(fc);
    }).catch(console.warn);

    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.endpoint === '/leadership') {
        const fc = pickFounder(detail.data || []);
        if (fc) setFounder(fc);
      }
    };
    window.addEventListener('ysp:api-refreshed', onRefresh);
    return () => window.removeEventListener('ysp:api-refreshed', onRefresh);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">
      
      {/* Top Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 md:p-12 border-b-4 border-amber-500 flex flex-col md:flex-row gap-8 items-center">
        <img
          src={founder?.photoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
          alt="Founder Chairman Irfan Mateen"
          className="w-52 h-52 rounded-2xl object-cover object-[center_15%] border-4 border-amber-400 shadow-2xl shrink-0 bg-white"
        />
        <div className="space-y-3">
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
            Leadership Spotlight
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold">{founder?.name || 'Irfan Mateen'}</h1>
          <p className="text-amber-400 font-bold text-sm tracking-widest uppercase">
            {founder?.designation || 'Founder Chairman, Youth Senate of Pakistan'}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Mail className="w-4 h-4 text-amber-400" />
            <span>{founder?.email || 'chairman@youthsenate.pk'}</span>
          </div>
        </div>
      </div>

      {/* Founder Message & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
            <Quote className="w-5 h-5 text-amber-500" />
            <span>Founder's Message</span>
          </div>

          <blockquote className="text-base text-slate-800 italic leading-relaxed border-l-4 border-emerald-800 pl-4 bg-emerald-50/50 py-3 rounded-r">
            "{founder?.message || 'Pakistan\'s future rests in the hands of its vibrant youth. Through Youth Senate of Pakistan, our objective is to instill constitutional knowledge, democratic values, and leadership integrity in young minds across every district of our nation.'}"
          </blockquote>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Leadership Biography & Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {founder?.biography || 'Irfan Mateen is the visionary Founder Chairman of Youth Senate of Pakistan. Dedicated to empowering the next generation of Pakistani leaders, he established YSP to bridge the gap between youth civic passion and formal parliamentary knowledge.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 bg-emerald-950 text-white p-8 rounded-2xl border-t-4 border-amber-400 shadow-md space-y-4">
          <h3 className="text-base font-bold text-amber-300 uppercase">Leadership Philosophy</h3>
          <ul className="text-xs text-emerald-100 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Youth empowerment through structured democratic learning.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Equal parliamentary representation across all provinces and districts.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Non-partisan, objective youth advocacy focused on national development.</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-emerald-800">
            <button
              onClick={() => navigate('apply')}
              className="w-full py-2.5 bg-amber-500 text-emerald-950 font-bold text-xs uppercase rounded text-center hover:bg-amber-400"
            >
              Apply to Join YSP
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
