import React, { useState } from 'react';
import { useYSP } from '../context/YSPContext';
import { 
  Landmark, 
  Globe, 
  User, 
  Menu, 
  X, 
  ShieldAlert, 
  ChevronDown, 
  Award, 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle2,
  LogIn,
  LogOut,
  Facebook
} from 'lucide-react';

// lucide-react has no official TikTok glyph, so a small inline SVG is used
// to match its icon sizing/stroke conventions.
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
  </svg>
);

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/19FNHGgekR/',
  tiktok: 'https://www.tiktok.com/@youthsenatepakistan?_r=1&_t=ZS-98vyV8aI6ZI'
};

export const Header: React.FC = () => {
  const { language, setLanguage, t, isRtl, currentView, navigate, currentUser, logout, adminUser, logoutAdmin, siteSettings } = useYSP();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const mainNavItems = [
    { key: 'home', label: t('navHome') },
    { key: 'about', label: t('navAbout') },
    { key: 'leadership', label: t('navLeadership') },
    { key: 'youth-senate', label: t('navYouthSenate') },
    { key: 'committees', label: t('navCommittees') },
    { key: 'senators', label: t('navSenators') },
    { key: 'chapters', label: t('navDistricts') },
    { key: 'sessions', label: t('navSessions') },
    { key: 'events', label: t('navEvents') },
    { key: 'news', label: t('navNews') }
  ];

  const secondaryNavItems = [
    { key: 'publications', label: t('navPublications') },
    { key: 'gallery', label: t('navGallery') },
    { key: 'videos', label: 'Video Gallery' },
    { key: 'membership', label: t('navMembership') },
    { key: 'mun', label: 'Youth MUN' },
    { key: 'verify', label: t('navVerifyCert') },
    { key: 'resolutions', label: 'Resolutions' },
    { key: 'questions', label: 'Questions' },
    { key: 'constitution', label: 'Constitution' },
    { key: 'contact', label: t('navContact') },
    { key: 'admin', label: 'Admin Panel 🔐' }
  ];

  const handleNavClick = (view: string) => {
    navigate(view);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-emerald-950 text-white shadow-xl border-b border-amber-500/30">
      {/* Top Banner / Urdu Switch & Quick Portal Bar */}
      <div className="bg-emerald-900/80 border-b border-emerald-800/60 px-4 py-1.5 text-xs text-emerald-100 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
          <span className="inline-flex items-center gap-1 text-amber-300 font-semibold tracking-wide whitespace-nowrap">
            <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">YOUTH SENATE OF PAKISTAN</span>
          </span>
          <span className="hidden md:inline text-emerald-400">|</span>
          <span className="hidden md:inline text-emerald-200">National Youth Parliamentary Platform</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse shrink-0">
          {/* Social Media Links — visible on every page */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Youth Senate of Pakistan on Facebook"
              className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-200 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Youth Senate of Pakistan on TikTok"
              className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-200 hover:text-white hover:bg-black hover:border-black transition-colors"
            >
              <TikTokIcon className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-emerald-950/80 rounded-full border border-emerald-700/60 p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                language === 'en' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ur')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                language === 'ur' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>

          {/* User Auth Status or Portal Button */}
          {adminUser ? (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-amber-300 font-medium">
                <span className="hidden sm:inline">{adminUser.name} ({adminUser.role})</span>
              </span>
              <button
                onClick={() => handleNavClick('admin')}
                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-2 py-0.5 rounded text-xs font-bold"
              >
                Admin CMS
              </button>
              <button
                onClick={logoutAdmin}
                className="text-emerald-300 hover:text-red-300 p-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : currentUser ? (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-amber-300 font-medium">
                <span className="hidden sm:inline">{currentUser.name} ({currentUser.role})</span>
              </span>
              <button
                onClick={() => handleNavClick('portal')}
                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-2 py-0.5 rounded text-xs font-bold"
              >
                My Portal
              </button>
              <button
                onClick={logout}
                className="text-emerald-300 hover:text-red-300 p-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('portal')}
              className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('navSenatorLogin')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-white border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-md group-hover:border-amber-300 transition-all overflow-hidden shrink-0">
            <img 
              src={siteSettings.logoUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg'} 
              alt="Youth Senate of Pakistan Official Emblem" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
              {siteSettings.organizationName || t('organizationName')}
            </div>
            <div className="text-xs text-amber-400/90 font-medium tracking-widest uppercase">
              {t('motto')}
            </div>
          </div>
        </div>

        {/* Desktop Primary Nav Items */}
        <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse text-xs font-semibold uppercase tracking-wider">
          {mainNavItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`px-2.5 py-1.5 rounded transition-all ${
                currentView === item.key
                  ? 'bg-emerald-800/90 text-amber-300 border-b-2 border-amber-400'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* More Dropdown for Secondary Items */}
          <div className="relative">
            <button
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className="px-2.5 py-1.5 rounded text-emerald-100 hover:text-white hover:bg-emerald-900/60 flex items-center gap-1"
            >
              <span>MORE</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {moreDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-emerald-900 border border-emerald-700/80 rounded-lg shadow-2xl py-2 z-50 text-left">
                {secondaryNavItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-800 hover:text-amber-300 transition-colors flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => handleNavClick('verify')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-100 border border-emerald-600 rounded-lg hover:border-amber-400 hover:text-amber-300 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>VERIFY</span>
          </button>

          <button
            onClick={() => handleNavClick('apply')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
          >
            {t('navJoinYSP')}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950 border-t border-emerald-800 px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleNavClick('apply')}
              className="w-full py-2 bg-amber-500 text-emerald-950 text-xs font-bold uppercase rounded-lg text-center"
            >
              {t('navJoinYSP')}
            </button>
            <button
              onClick={() => handleNavClick('portal')}
              className="w-full py-2 border border-amber-400 text-amber-300 text-xs font-bold uppercase rounded-lg text-center"
            >
              {t('navSenatorLogin')}
            </button>
          </div>

          <div className="divide-y divide-emerald-900">
            <div className="py-2 space-y-1">
              {[...mainNavItems, ...secondaryNavItems].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${
                    currentView === item.key
                      ? 'bg-emerald-800 text-amber-300 font-bold'
                      : 'text-emerald-100 hover:bg-emerald-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
