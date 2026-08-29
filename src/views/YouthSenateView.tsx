import React from 'react';
import { useYSP } from '../context/YSPContext';
import { Landmark, CheckCircle2, ShieldCheck, ArrowRight, BookOpen, MessageSquare, Award } from 'lucide-react';
import { MunPromoBanner } from '../components/MunPromoBanner';

export const YouthSenateView: React.FC = () => {
  const { navigate, t } = useYSP();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 bg-slate-50 text-slate-900">
      
      {/* Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 md:p-12 border-b-4 border-amber-500 space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Parliamentary Simulation & Learning</span>
        <h1 className="text-3xl md:text-5xl font-extrabold">What is Youth Senate of Pakistan?</h1>
        <p className="text-emerald-100/90 text-sm md:text-base max-w-3xl leading-relaxed">
          Youth Senate of Pakistan is an authentic youth parliamentary training ground designed to groom future leaders, foster constructive policy debate, and teach parliamentary etiquette and legislative processes.
        </p>
      </div>

      {/* Core Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <BookOpen className="w-8 h-8 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Parliamentary Procedures</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Members learn rules of order, parliamentary question submission, calling attention notices, and resolution drafting.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <MessageSquare className="w-8 h-8 text-emerald-800" />
          <h3 className="text-lg font-bold text-slate-900">Debate & Policy Writing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Constructive, non-partisan debate on national youth issues including education, climate, digital economy, and social welfare.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Award className="w-8 h-8 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900">Leadership & Credentials</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Youth Senators receive official appointment credentials, committee experience, and verified participation certificates.
          </p>
        </div>
      </div>

      {/* Interactive "How Youth Senate Works" Diagram */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Parliamentary Lifecycle</span>
          <h2 className="text-2xl font-bold text-slate-900">How Youth Senate Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          {[
            { step: '01', title: 'Online Membership Application', desc: 'Submit application with district details & committee preferences.' },
            { step: '02', title: 'Scrutiny & Appointment', desc: 'Secretariat reviews profile & issues Youth Senator Membership ID.' },
            { step: '03', title: 'Standing Committee Assignment', desc: 'Join assigned standing committee to draft policy proposals.' },
            { step: '04', title: 'Parliamentary Sitting', desc: 'Attend sittings, present resolutions, ask questions & receive credentials.' }
          ].map((st, i) => (
            <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-2 relative">
              <span className="text-2xl font-black text-amber-500">{st.step}</span>
              <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
              <p className="text-xs text-slate-600">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <MunPromoBanner />

      {/* CTA */}
      <div className="bg-emerald-950 text-white p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-2xl font-bold">Apply for Youth Senator Membership</h3>
        <p className="text-xs text-emerald-200 max-w-lg mx-auto">
          Represent your district and contribute to Pakistan's youth parliamentary platform.
        </p>
        <button
          onClick={() => navigate('apply')}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase rounded-lg shadow"
        >
          {t('navJoinYSP')}
        </button>
      </div>

    </div>
  );
};
