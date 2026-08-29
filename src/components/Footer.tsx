import React, { useState } from 'react';
import { useYSP } from '../context/YSPContext';
import { Landmark, Mail, Phone, MapPin, ExternalLink, ShieldAlert, Send, HeartHandshake } from 'lucide-react';
import { fetchApi } from '../lib/api';

export const Footer: React.FC = () => {
  const { siteSettings, t, navigate, showNotification } = useYSP();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubmitting(true);
    try {
      await fetchApi('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail })
      });
      showNotification('Successfully subscribed to Youth Senate of Pakistan updates!');
      setNewsletterEmail('');
    } catch (e: any) {
      showNotification(e.message || 'Subscription failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t-4 border-amber-500">
      {/* Top Institutional Disclaimer Box */}
      <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-3 text-xs text-emerald-200">
        <div className="max-w-7xl mx-auto flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300">Disclaimer & Institutional Status: </strong>
            {siteSettings.legalDisclaimer}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Column 1: Organization Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer" onClick={() => navigate('home')}>
            <div className="w-12 h-12 rounded-full bg-white border border-amber-400 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src={siteSettings.logoUrl || '/images/ysp_official_logo_1786441197850.jpg'} 
                alt="Youth Senate of Pakistan Official Emblem" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">{siteSettings.organizationName}</div>
              <div className="text-xs text-amber-400 uppercase tracking-widest">{t('motto')}</div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Youth Senate of Pakistan provides young citizens with a structured platform to develop parliamentary knowledge, hone leadership skills, engage in democratic dialogue, and write policy proposals for national advancement.
          </p>

          <div className="space-y-2 text-xs text-slate-300 pt-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{siteSettings.officeAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{siteSettings.officialEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{siteSettings.officialPhone}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 border-b border-slate-800 pb-2">
            {t('footerQuickLinks')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => navigate('about')} className="hover:text-amber-300 transition-colors">About YSP</button></li>
            <li><button onClick={() => navigate('founder')} className="hover:text-amber-300 transition-colors">Founder Chairman</button></li>
            <li><button onClick={() => navigate('leadership')} className="hover:text-amber-300 transition-colors">Executive Leadership</button></li>
            <li><button onClick={() => navigate('committees')} className="hover:text-amber-300 transition-colors">Standing Committees</button></li>
            <li><button onClick={() => navigate('senators')} className="hover:text-amber-300 transition-colors">Senators Directory</button></li>
            <li><button onClick={() => navigate('mun')} className="hover:text-amber-300 transition-colors">Youth MUN</button></li>
            <li><button onClick={() => navigate('sessions')} className="hover:text-amber-300 transition-colors">Parliamentary Sessions</button></li>
            <li><button onClick={() => navigate('events')} className="hover:text-amber-300 transition-colors">Events & Conventions</button></li>
          </ul>
        </div>

        {/* Column 3: Resources & Verification */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 border-b border-slate-800 pb-2">
            {t('footerResources')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => navigate('verify')} className="hover:text-amber-300 text-amber-300 font-semibold flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Verify Certificate</button></li>
            <li><button onClick={() => navigate('publications')} className="hover:text-amber-300 transition-colors">Publications & Reports</button></li>
            <li><button onClick={() => navigate('downloads')} className="hover:text-amber-300 transition-colors">Document Repository</button></li>
            <li><button onClick={() => navigate('constitution')} className="hover:text-amber-300 transition-colors">Constitution & Rules</button></li>
            <li><button onClick={() => navigate('resolutions')} className="hover:text-amber-300 transition-colors">Passed Resolutions</button></li>
            <li><button onClick={() => navigate('faq')} className="hover:text-amber-300 transition-colors">Frequently Asked Questions</button></li>
            <li><button onClick={() => navigate('contact')} className="hover:text-amber-300 transition-colors">Official Contact Desk</button></li>
          </ul>
        </div>

        {/* Column 4: Newsletter & Social */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 border-b border-slate-800 pb-2">
            Official Updates
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Subscribe to receive official session agendas, committee announcements, and membership notifications.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              placeholder="Enter official email"
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>{submitting ? 'Subscribing...' : 'Subscribe'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar & Copyright */}
      <div className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-xs text-slate-400 text-center md:flex md:justify-between max-w-7xl mx-auto">
        <div>
          © {new Date().getFullYear()} Youth Senate of Pakistan. {t('rightsReserved')}
        </div>
        <div className="flex justify-center space-x-4 rtl:space-x-reverse mt-2 md:mt-0">
          <button onClick={() => navigate('disclaimer')} className="hover:text-amber-300">Disclaimer</button>
          <span>•</span>
          <button onClick={() => navigate('constitution')} className="hover:text-amber-300">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => navigate('constitution')} className="hover:text-amber-300">Terms of Use</button>
        </div>
      </div>
    </footer>
  );
};
