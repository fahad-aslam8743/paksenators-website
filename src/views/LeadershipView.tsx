import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi, getCached } from '../lib/api';
import { LeadershipMember } from '../types/ysp';
import { ChevronRight, Mail, Phone } from 'lucide-react';

export const LeadershipView: React.FC = () => {
  const { navigate } = useYSP();
  // Paint instantly from cache if we have it (e.g. from a previous visit
  // this session), then the effect below refreshes it with live data.
  const [leadership, setLeadership] = useState<LeadershipMember[]>(
    () => getCached<LeadershipMember[]>('/leadership') || []
  );
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    fetchApi<LeadershipMember[]>('/leadership').then(setLeadership).catch(console.warn);

    // If the backend was briefly unreachable and recovers while this
    // screen is already open, pick up the corrected data automatically.
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.endpoint === '/leadership') setLeadership(detail.data);
    };
    window.addEventListener('ysp:api-refreshed', onRefresh);
    return () => window.removeEventListener('ysp:api-refreshed', onRefresh);
  }, []);

  const categories = [
    'All',
    'Founder Chairman',
    'President',
    'Vice President',
    'Finance Secretary',
    'Joint Secretary',
    'Press Secretary',
    'Office Secretary',
    'Chairman',
    'Deputy Chairman',
    'Leader of the House',
    'Standing Committee Chairpersons',
    'District Presidents',
    'District Secretaries',
    'Other Executive Members',
    'Executive Council',
    'Provincial Leadership',
    'District Leadership'
  ];

  const filtered = activeCategory === 'All'
    ? leadership
    : leadership.filter(l => l.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      
      {/* Header */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Executive Governance</span>
        <h1 className="text-3xl font-extrabold">Executive Leadership Directory</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Meet the executive bureau, provincial coordinators, and council members steering Youth Senate of Pakistan.
        </p>
      </div>

      {/* Categories filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-800 text-amber-300 shadow'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Leadership Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(member => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <img src={member.photoUrl} alt={member.name} referrerPolicy="no-referrer" className="w-full h-56 object-cover object-[center_15%]" />
              <div className="p-5 space-y-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded">
                  {member.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                <p className="text-xs font-semibold text-amber-700">{member.designation}</p>
                {member.phone && (
                  <p className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Contact: {member.phone}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500">{member.province} ({member.district})</p>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{member.biography}</p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-0">
              {member.category === 'Founder Chairman' && (
                <button
                  onClick={() => navigate('founder')}
                  className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1"
                >
                  <span>Founder Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
