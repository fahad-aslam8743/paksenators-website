import React from 'react';
import { useYSP } from '../context/YSPContext';
import { Globe2, ArrowRight } from 'lucide-react';

/**
 * A short, reusable "We also offer Youth MUN Membership" promo block.
 * Dropped into HomeView, AboutView, MembershipView, and YouthSenateView
 * so visitors on any of those pages know the Youth MUN track exists.
 */
export const MunPromoBanner: React.FC = () => {
  const { navigate } = useYSP();

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl p-6 md:p-8 border border-amber-400/60 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">We Also Offer</span>
            <h3 className="text-lg md:text-xl font-extrabold text-white">Youth MUN Membership</h3>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Join Youth Senate of Pakistan's Model United Nations track — conferences, training, public speaking, negotiation, and resolution writing for aspiring young diplomats. Learn. Debate. Negotiate. Lead.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('mun')}
          className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all"
        >
          <span>Learn More</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
