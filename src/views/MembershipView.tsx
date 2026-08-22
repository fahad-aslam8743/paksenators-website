import React from 'react';
import { useYSP } from '../context/YSPContext';
import { CheckCircle2, ShieldCheck, Award, ArrowRight, Globe2 } from 'lucide-react';
import { MunPromoBanner } from '../components/MunPromoBanner';

export const MembershipView: React.FC = () => {
  const { navigate, t, siteSettings } = useYSP();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">
      
      <div className="bg-emerald-950 text-white rounded-2xl p-8 md:p-12 border-b-4 border-amber-500 space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">National Youth Induction</span>
        <h1 className="text-3xl md:text-5xl font-extrabold">Youth Senate Membership</h1>
        <p className="text-emerald-100 text-sm md:text-base max-w-3xl leading-relaxed">
          Join a national network of young Pakistani leaders representing districts across Punjab, KPK, Sindh, Balochistan, ICT, GB, and AJK.
        </p>
        <button
          onClick={() => navigate('apply')}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-xs uppercase rounded-lg shadow-xl"
        >
          {t('btnApplyNow')}
        </button>
      </div>

      {/* Benefits */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Membership Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Parliamentary Sittings', desc: 'Participate in official youth sittings, introduce resolutions, and participate in debate.' },
            { title: 'Standing Committees', desc: 'Join specialized standing policy committees focusing on key national development issues.' },
            { title: 'Digital Credentials', desc: 'Receive an official Youth Senator Membership ID card and verified digital certificates.' },
            { title: 'District Leadership', desc: 'Represent your home district and coordinate grassroots civic youth initiatives.' },
            { title: 'Policy Advocacy', desc: 'Draft youth recommendations for national policy forums and public sector engagement.' },
            { title: 'National Network', desc: 'Connect with fellow youth leaders, legal researchers, and civic advocates across Pakistan.' }
          ].map((b, i) => (
            <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
              <p className="text-xs text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <MunPromoBanner />

      {/* Fee & Fee Waiver Note */}
      <div className="bg-emerald-900 text-white p-8 rounded-2xl space-y-3">
        <h3 className="text-xl font-bold text-amber-300">Membership Registration Fee</h3>
        <p className="text-xs text-emerald-100 leading-relaxed">
          Configured Fee: <strong>{siteSettings.currency} {siteSettings.membershipFeeAmount}</strong> (Covers digital card processing, credential verification, and administrative handling).
        </p>
        <p className="text-[11px] text-emerald-200 italic">
          Note: Youth Senate of Pakistan provides merit-based fee concessions for deserving applicants.
        </p>
      </div>

    </div>
  );
};
