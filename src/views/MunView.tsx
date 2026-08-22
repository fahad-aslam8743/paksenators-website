import React from 'react';
import { useYSP } from '../context/YSPContext';
import { Globe2, CheckCircle2, Mic2, Users, FileText, Copy, CreditCard, GraduationCap, BookOpen } from 'lucide-react';

export const MunView: React.FC = () => {
  const { navigate, showNotification } = useYSP();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">

      {/* Hero */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 md:p-12 border-b-4 border-amber-500 space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Model United Nations Track</span>
        <h1 className="text-3xl md:text-5xl font-extrabold">Empowering Young Voices Through Model United Nations</h1>
        <p className="text-emerald-100/90 text-sm md:text-base max-w-3xl leading-relaxed">
          Youth MUN is Youth Senate of Pakistan's dedicated Model United Nations track — training young delegates in diplomacy, negotiation, and global affairs.
        </p>
        <p className="text-amber-300 font-bold text-sm uppercase tracking-widest">Learn. Debate. Negotiate. Lead.</p>
        <button
          onClick={() => navigate('mun-apply')}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-xs uppercase rounded-lg shadow-xl"
        >
          Apply for Youth MUN Membership
        </button>
      </div>

      {/* Mission line */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-700 text-sm md:text-base leading-relaxed italic max-w-4xl mx-auto text-center">
          "To create a generation of confident, informed, and responsible young leaders who can understand global challenges, engage in constructive dialogue, and contribute positively to society."
        </p>
      </div>

      {/* What We Do */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">What We Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Participate in national and international Model United Nations conferences',
            'Structured training sessions on parliamentary and diplomatic procedure',
            'Public speaking and persuasive communication workshops',
            'Negotiation and consensus-building simulations',
            'Resolution writing and formal position paper drafting',
            'Committee simulations covering global policy issues'
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Our Training */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Mic2 className="w-8 h-8 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Public Speaking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Delegates are coached on confident, articulate delivery — from opening statements to closing arguments.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Users className="w-8 h-8 text-emerald-800" />
          <h3 className="text-lg font-bold text-slate-900">Negotiation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Members practice bloc-building, lobbying, and diplomatic negotiation across simulated committees.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <FileText className="w-8 h-8 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Resolution Writing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Trainees learn to draft formal resolutions and position papers according to MUN conventions.
          </p>
        </div>
      </div>

      {/* Eligibility */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-emerald-800" />
          <span>Membership Eligibility</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Bachelor's or Master's degree holder",
            'Strong English communication & public speaking ability',
            'Good current affairs / international affairs knowledge',
            'Strong interest in International Relations & diplomacy',
            'Good analytical, research, and communication skills',
            'Willing to participate in MUN trainings, conferences & simulations',
            'Male and female candidates both eligible'
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-8 rounded-2xl border-2 border-amber-400 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-black text-[10px] uppercase rounded">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Registration Fee & Payment Details</span>
            </div>
            <h3 className="text-xl font-extrabold text-amber-300">Registration Fee: PKR 5,000</h3>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-xl">
              Payable via Easypaisa or NayaPay. Upload your payment screenshot during the application process.
            </p>
          </div>
          <div className="bg-emerald-950/90 border-2 border-amber-400/80 p-4 rounded-xl text-xs space-y-2 shrink-0 min-w-[260px] shadow-lg">
            <div className="flex justify-between items-center pb-1.5 border-b border-amber-400/30">
              <span className="text-amber-300 font-bold uppercase text-[10px]">Fee Amount</span>
              <span className="text-amber-300 font-black text-sm">PKR 5,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-200 text-[11px]">Easypaisa / NayaPay No:</span>
              <div className="flex items-center gap-1">
                <strong className="text-white font-mono text-sm tracking-wider">03459193927</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('03459193927');
                    showNotification('Account Number copied: 03459193927');
                  }}
                  className="p-1 hover:bg-amber-400/20 text-amber-300 rounded"
                  title="Copy Number"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-200 text-[11px]">Account Title:</span>
              <strong className="text-amber-300 font-bold text-xs uppercase">Irfan Mateen</strong>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('mun-apply')}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-xs uppercase rounded-lg shadow-xl"
        >
          Apply for Youth MUN Membership
        </button>
      </div>

      {/* Process Stepper */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Membership Pathway</span>
          <h2 className="text-2xl font-bold text-slate-900">Application Process</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { step: '01', title: 'Fill Form' },
            { step: '02', title: 'Pay Fee (PKR 5,000)' },
            { step: '03', title: 'Submit Payment Proof' },
            { step: '04', title: 'Review & Shortlisting' },
            { step: '05', title: 'Interview' },
            { step: '06', title: 'Final Selection & Membership' }
          ].map((st, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xl font-black text-amber-500">{st.step}</span>
              <h4 className="text-xs font-bold text-slate-900">{st.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-emerald-950 text-white p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Globe2 className="w-6 h-6 text-amber-400" />
          <span>Ready to Represent as a Youth MUN Delegate?</span>
        </h3>
        <p className="text-xs text-emerald-200 max-w-lg mx-auto">
          Apply today and join a national network of young diplomats and policy thinkers.
        </p>
        <button
          onClick={() => navigate('mun-apply')}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase rounded-lg shadow"
        >
          Apply for Youth MUN Membership
        </button>
      </div>

    </div>
  );
};
