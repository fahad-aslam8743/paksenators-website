import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { 
  Landmark, 
  Award, 
  Users, 
  ShieldCheck, 
  FileText, 
  Zap, 
  HeartHandshake, 
  Flag, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Search, 
  ChevronRight, 
  Clock, 
  FileCheck, 
  Building2,
  Sparkles,
  Quote
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { MunPromoBanner } from '../components/MunPromoBanner';
import { 
  LeadershipMember, 
  Committee, 
  Session, 
  EventItem, 
  NewsItem, 
  DistrictChapter 
} from '../types/ysp';

export const HomeView: React.FC = () => {
  const { siteSettings, stats, t, navigate, showNotification } = useYSP();

  // Dynamic Data States
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [chapters, setChapters] = useState<DistrictChapter[]>([]);
  
  // Verification Quick Search
  const [certInput, setCertInput] = useState('');

  // District Chapter Selected Region
  const [selectedProvince, setSelectedProvince] = useState<string>('All');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [leadData, comData, sessData, evtData, newsData, chapData] = await Promise.all([
          fetchApi<LeadershipMember[]>('/leadership'),
          fetchApi<Committee[]>('/committees'),
          fetchApi<Session[]>('/sessions'),
          fetchApi<EventItem[]>('/events'),
          fetchApi<NewsItem[]>('/news'),
          fetchApi<DistrictChapter[]>('/chapters')
        ]);

        if (leadData) setLeadership(leadData);

        if (comData) setCommittees(comData);
        if (sessData) setSessions(sessData);
        if (evtData) setEvents(evtData);
        if (newsData) setNews(newsData);
        if (chapData) setChapters(chapData);
      } catch (e) {
        console.warn('Failed to fetch home feed data', e);
      }
    };
    loadHomeData();
  }, []);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    navigate('verify', certInput.trim());
  };

  const provincesList = [
    'All',
    'Khyber Pakhtunkhwa',
    'Punjab',
    'Sindh',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu & Kashmir'
  ];

  const filteredChapters = selectedProvince === 'All' 
    ? chapters 
    : chapters.filter(c => c.province === selectedProvince);

  return (
    <div className="space-y-16 pb-12 bg-slate-50 text-slate-900">
      
      {/* SECTION 1: HERO SECTION */}
      <section className="relative bg-emerald-950 text-white pt-16 pb-24 overflow-hidden border-b-4 border-amber-500">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-900/90 border border-amber-400/50 text-amber-300 text-xs font-semibold tracking-wide">
              <img 
                src="/images/ysp_official_logo_1786441197850.jpg" 
                alt="Emblem" 
                className="w-5 h-5 rounded-full bg-white object-contain p-0.5 border border-amber-400"
              />
              <span>OFFICIAL YOUTH PARLIAMENTARY PLATFORM</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {siteSettings.heroHeadline}
            </h1>

            <p className="text-base md:text-lg text-emerald-100/90 leading-relaxed max-w-2xl">
              {siteSettings.heroDescription}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate('apply')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-extrabold text-sm uppercase tracking-wider rounded-lg shadow-xl hover:shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <span>{t('navJoinYSP')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('sessions')}
                className="px-6 py-3 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/80 font-bold text-sm uppercase tracking-wider rounded-lg transition-all flex items-center gap-2"
              >
                <span>EXPLORE SESSIONS</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-emerald-900/60 p-2.5 group">
              <img
                src={leadership.find(l => l.category === 'Founder Chairman' || l.name.includes('Irfan Mateen'))?.photoUrl || "/images/irfan_mateen_original_1786443966305.jpg"}
                alt="Founder Chairman Irfan Mateen"
                className="w-full h-96 object-cover object-[center_15%] rounded-xl border border-amber-400/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent flex items-end p-5">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 bg-amber-500 text-emerald-950 font-black text-[10px] uppercase rounded tracking-wider">
                    Founder Chairman
                  </span>
                  <h3 className="text-xl font-extrabold text-white">Irfan Mateen</h3>
                  <p className="text-emerald-200 text-xs font-medium">Founder Chairman, Youth Senate of Pakistan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTRODUCTION */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Institutional Overview</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('aboutTitle')}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Youth Senate of Pakistan is a structured, non-partisan parliamentary platform designed to provide Pakistani youth with authentic exposure to legislative procedure, policy drafting, debate etiquette, and constitutional governance. We aim to equip young leaders across every province and district with the tools required for civic leadership and national contribution.
            </p>
            <div>
              <button
                onClick={() => navigate('about')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs font-bold uppercase rounded hover:bg-emerald-900 transition-colors"
              >
                <span>{t('btnReadMore')}</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 bg-emerald-50 rounded-xl p-6 border border-emerald-100 space-y-3">
            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Institutional Core</span>
            </h3>
            <ul className="text-xs text-emerald-900 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Parliamentary Training & Procedure</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Standing Committee System</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Nationwide District Chapter Outreach</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Non-Partisan Democratic Values</li>
            </ul>
          </div>
        </div>
      </section>

      <MunPromoBanner />

      {/* SECTION 3 & 4: VISION & MISSION */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-8 shadow-md border-t-4 border-amber-400 space-y-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-amber-300">{t('visionTitle')}</h3>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            {siteSettings.visionStatement}
          </p>
        </div>

        <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-md border-t-4 border-emerald-800 space-y-4 border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-emerald-800" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900">{t('missionTitle')}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {siteSettings.missionStatement}
          </p>
        </div>
      </section>

      {/* SECTION 5: CORE OBJECTIVES */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pillars of Impact</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('objectivesTitle')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteSettings.coreObjectives.map((obj, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">{obj.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{obj.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOUNDER CHAIRMAN MESSAGE SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4">
        {(() => {
          const founderMember = leadership.find(l => l.category === 'Founder Chairman' || l.name.includes('Irfan Mateen'));
          return (
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-3xl p-8 md:p-10 border-2 border-amber-400 shadow-xl flex flex-col md:flex-row items-center gap-8">
              <img
                src={founderMember?.photoUrl || "/images/irfan_mateen_original_1786443966305.jpg"}
                alt="Founder Chairman Irfan Mateen"
                className="w-48 h-56 rounded-2xl object-cover object-[center_15%] border-4 border-amber-400 shadow-2xl shrink-0 bg-white"
              />
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
                    Founder Chairman's Message
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white">{founderMember?.name || 'Irfan Mateen'}</h3>
                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">{founderMember?.designation || 'Founder Chairman, Youth Senate of Pakistan'}</p>
                
                <blockquote className="text-sm md:text-base text-emerald-100 italic leading-relaxed border-l-4 border-amber-400 pl-4 py-1">
                  "{founderMember?.message || "Pakistan's future rests in the hands of its vibrant youth. Through Youth Senate of Pakistan, our objective is to instill constitutional knowledge, democratic values, and leadership integrity in young minds across every district of our nation."}"
                </blockquote>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    onClick={() => navigate('founder')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase rounded-lg shadow transition-colors flex items-center gap-1.5"
                  >
                    <span>Read Full Message & Biography</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* SECTION 6: EXECUTIVE LEADERSHIP HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Governance & Vision</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('leadershipTitle')}</h2>
          </div>
          <button
            onClick={() => navigate('leadership')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            <span>VIEW ALL LEADERSHIP</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leadership.slice(0, 3).map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-full h-64 object-cover object-[center_15%]"
              />
              <div className="p-6 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider">
                  {member.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-xs text-amber-700 font-semibold">{member.designation}</p>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{member.biography}</p>
                <button
                  onClick={() => navigate(member.category === 'Founder Chairman' ? 'founder' : 'leadership')}
                  className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1 pt-2"
                >
                  <span>Read Full Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: PARLIAMENTARY STRUCTURE HIERARCHY */}
      <section className="bg-emerald-950 text-white py-12 border-y border-amber-500/40">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Democratic Framework</span>
            <h2 className="text-2xl md:text-3xl font-bold">{t('structureTitle')}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { label: 'Youth Senate', sub: 'Supreme Assembly' },
              { label: 'Executive Leadership', sub: 'Bureau' },
              { label: 'Parliamentary Bodies', sub: 'Senate Secretariat' },
              { label: 'Standing Committees', sub: 'Policy Wings' },
              { label: 'Provincial Chapters', sub: 'Provinces & Regions' },
              { label: 'Youth Senators', sub: 'District Representatives' }
            ].map((node, i) => (
              <div key={i} className="bg-emerald-900/80 border border-emerald-700 p-4 rounded-xl space-y-1">
                <div className="text-amber-400 font-extrabold text-sm">{node.label}</div>
                <div className="text-[10px] text-emerald-200">{node.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: DYNAMIC NATIONAL STATISTICS */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-8 border-2 border-amber-400/80 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Database Records</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{t('statisticsTitle')}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.senatorsCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statSenators')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.districtChaptersCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statChapters')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.standingCommitteesCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statCommittees')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.sessionsCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statSessions')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.eventsCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statEvents')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold text-amber-400">{stats.certificatesCount}</div>
              <div className="text-xs text-emerald-200 font-medium">{t('statCertificates')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: UPCOMING EVENTS */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Participation & Assembly</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('upcomingEventsTitle')}</h2>
          </div>
          <button
            onClick={() => navigate('events')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            <span>VIEW ALL EVENTS</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map(evt => (
            <div key={evt.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <img src={evt.imageUrl} alt={evt.title} className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    {evt.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">{evt.title}</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-600" /> {evt.date} • {evt.time}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {evt.venue}, {evt.city}</div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <button
                  onClick={() => navigate('events', evt.id)}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded text-center transition-colors"
                >
                  View Event Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10: LATEST NEWS */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Media & Bulletins</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('latestNewsTitle')}</h2>
          </div>
          <button
            onClick={() => navigate('news')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            <span>ALL NEWS ARTICLES</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.slice(0, 2).map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <img src={item.imageUrl} alt={item.title} className="sm:col-span-5 w-full h-36 object-cover rounded-lg" />
              <div className="sm:col-span-7 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-600">{item.category} • {item.date}</span>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{item.excerpt}</p>
                <button
                  onClick={() => navigate('news', item.id)}
                  className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1"
                >
                  <span>Read Article</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 11: PARLIAMENTARY SESSIONS */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Legislative Proceedings</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('sessionsTitle')}</h2>
          </div>
          <button
            onClick={() => navigate('sessions')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            <span>VIEW SESSIONS ARCHIVE</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {sessions.slice(0, 2).map(sess => (
            <div key={sess.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-900 text-amber-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                    {sess.sessionNumber}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">• {sess.status}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{sess.title}</h3>
                <p className="text-xs text-slate-500">Date: {sess.date} | Venue: {sess.venue}</p>
              </div>
              <button
                onClick={() => navigate('sessions', sess.id)}
                className="px-4 py-2 border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white rounded text-xs font-bold uppercase transition-colors shrink-0"
              >
                View Proceedings
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 12: STANDING COMMITTEES */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Policy Bodies</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('standingCommitteesTitle')}</h2>
          </div>
          <button
            onClick={() => navigate('committees')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            <span>ALL COMMITTEES</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.slice(0, 3).map(com => (
            <div key={com.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase">{com.code}</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {com.memberCount} Members
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{com.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-3">{com.mandate}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Chair: {com.chairpersonName}</span>
                <button
                  onClick={() => navigate('committees', com.id)}
                  className="font-bold text-emerald-800 hover:text-amber-600"
                >
                  Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 13: DISTRICT CHAPTERS MAP & REGIONAL SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">National Representation</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('districtChaptersTitle')}</h2>
            <p className="text-xs text-slate-500">Select a province/region to view active Youth Senate district chapters.</p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {provincesList.map(prov => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedProvince === prov
                    ? 'bg-emerald-800 text-amber-300 shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {filteredChapters.map(chap => (
              <div key={chap.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{chap.name}</h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {chap.senatorCount} Senators
                  </span>
                </div>
                <p className="text-xs text-slate-500">{chap.province}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{chap.description}</p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('chapters', chap.id)}
                    className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1"
                  >
                    <span>Chapter Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 14: JOIN YOUTH SENATE CTA */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl p-10 border-2 border-amber-400 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Become Part of Pakistan's Youth Parliamentary Movement
          </h2>
          <p className="text-sm md:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Represent your district, learn parliamentary legislation, participate in standing committees, and shape youth recommendations for Pakistan.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('apply')}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-emerald-950 font-extrabold text-sm uppercase rounded-lg shadow-xl"
            >
              {t('btnApplyNow')}
            </button>
            <button
              onClick={() => navigate('membership')}
              className="px-8 py-3.5 bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-600 font-bold text-sm uppercase rounded-lg"
            >
              LEARN ABOUT MEMBERSHIP
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 15: QUICK CERTIFICATE VERIFICATION */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-amber-500" />
              <span>Verify Official YSP Certificate</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter your certificate tracking number to instantly verify authenticity.
            </p>
          </div>

          <form onSubmit={handleQuickVerify} className="flex gap-2">
            <input
              type="text"
              value={certInput}
              onChange={e => setCertInput(e.target.value)}
              placeholder={t('placeholderCertNumber')}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded-lg shrink-0"
            >
              Verify
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};
