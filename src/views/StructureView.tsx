import React from 'react';
import { useYSP } from '../context/YSPContext';
import { Landmark, Users, ArrowDown, ChevronRight } from 'lucide-react';

export const StructureView: React.FC = () => {
  const { navigate } = useYSP();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Organizational Blueprint</span>
        <h1 className="text-3xl font-extrabold">Parliamentary Structure</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Detailed hierarchy from Founder Chairman & Executive Bureau to Standing Committees and District Chapters.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {[
          { level: '1. Founder Chairman & Executive Presidium', title: 'Supreme Governance & Direction', desc: 'Provides institutional oversight, legal safeguards, and overall vision.' },
          { level: '2. Executive Bureau & Secretariat', title: 'Daily Administrative Operations', desc: 'Managed by President, Vice President, Secretaries, and Bureau Leads.' },
          { level: '3. Standing Committees', title: 'Policy & Legislative Wings', desc: '6+ specialized standing committees focusing on Education, Climate, Global Affairs, Legal, Media, and Welfare.' },
          { level: '4. Youth Senators', title: 'House Members & Representatives', desc: 'District representatives participating in sittings, debates, and voting on resolutions.' },
          { level: '5. Provincial & District Chapters', title: 'Grassroots National Outreach', desc: 'Chapters established in KP, Punjab, Sindh, Balochistan, ICT, GB, and AJK.' }
        ].map((block, i) => (
          <React.Fragment key={i}>
            <div className="bg-white rounded-xl p-6 border-2 border-emerald-800/30 shadow-sm space-y-2 relative">
              <span className="text-xs font-bold text-amber-600 uppercase">{block.level}</span>
              <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
              <p className="text-xs text-slate-600">{block.desc}</p>
            </div>
            {i < 4 && (
              <div className="flex justify-center my-2">
                <ArrowDown className="w-6 h-6 text-emerald-800 animate-bounce" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
