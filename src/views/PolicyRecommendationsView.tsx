import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { PolicyRecommendation } from '../types/ysp';
import { FileText, Lightbulb } from 'lucide-react';

export const PolicyRecommendationsView: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRecommendation[]>([]);

  useEffect(() => {
    fetchApi<PolicyRecommendation[]>('/policy-recommendations').then(setPolicies).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Youth Policy Papers</span>
        <h1 className="text-3xl font-extrabold">Policy Recommendations</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Policy papers and recommendations formulated by Youth Senate Standing Committees on national priorities.
        </p>
      </div>

      <div className="space-y-6">
        {policies.map(pol => (
          <div key={pol.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded uppercase">
                {pol.category}
              </span>
              <span className="text-xs text-slate-500">{pol.publishDate}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{pol.title}</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <p><strong>Background:</strong> {pol.issueBackground}</p>
              <p><strong>Youth Perspective:</strong> {pol.youthPerspective}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-900 uppercase">Key Recommendations:</span>
              <ul className="list-disc list-inside text-xs text-emerald-900 space-y-1">
                {pol.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
