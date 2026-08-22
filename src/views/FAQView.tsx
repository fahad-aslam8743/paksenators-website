import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQView: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { q: 'What is Youth Senate of Pakistan?', a: 'Youth Senate of Pakistan is a non-partisan youth parliamentary platform dedicated to parliamentary learning, democratic debate, policy writing, and leadership grooming.' },
    { q: 'Who can become a member?', a: 'Pakistani citizens aged 18-35 from all provinces (Punjab, KPK, Sindh, Balochistan), ICT, Gilgit-Baltistan, and Azad Jammu & Kashmir are eligible to apply.' },
    { q: 'How can I apply for membership?', a: 'Navigate to the Online Membership Application portal, complete the required details, select your preferred standing committee, and submit.' },
    { q: 'What happens after I submit my application?', a: 'Applications undergo scrutiny by the Secretariat. Shortlisted applicants may be invited for a virtual interview before official appointment and issuance of a Membership ID.' },
    { q: 'What are Standing Committees?', a: 'Standing committees are specialized bodies focusing on specific national domains (Education, Climate, Legal, Media, Global Affairs, Welfare) to draft policy proposals.' },
    { q: 'How can I verify an official certificate?', a: 'Visit the "Verify Certificate" page and enter the unique tracking code printed on the document.' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2 text-center">
        <HelpCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Help Center</span>
        <h1 className="text-3xl font-extrabold">Frequently Asked Questions</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="border-b last:border-0 pb-3">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full text-left font-bold text-sm text-slate-900 flex justify-between items-center py-2 hover:text-emerald-800"
            >
              <span>{f.q}</span>
              {openIdx === i ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openIdx === i && (
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
