import React, { useState, useEffect, useRef } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { CMSDataService } from '../services/CMSDataService';
import { 
  SiteSettings, 
  MembershipApplication, 
  Senator, 
  LeadershipMember, 
  Committee, 
  DistrictChapter, 
  EventItem, 
  NewsItem, 
  ContactMessage 
} from '../types/ysp';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings, 
  FileText, 
  Award, 
  Building2, 
  Calendar, 
  Newspaper, 
  Mail, 
  Trash2, 
  Plus, 
  Edit, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Download,
  Layout,
  Globe,
  Globe2,
  Crown,
  Film,
  Folder,
  Lock,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { LeadershipCMS } from '../components/LeadershipCMS';
import { VideoManagementCMS } from '../components/VideoManagementCMS';
import { BrandingCMS } from '../components/cms/BrandingCMS';
import { HomepageCMS } from '../components/cms/HomepageCMS';
import { PageContentCMS } from '../components/cms/PageContentCMS';
import { SenatorCMS } from '../components/cms/SenatorCMS';
import { EventNewsCMS } from '../components/cms/EventNewsCMS';
import { MembershipAdminCMS } from '../components/cms/MembershipAdminCMS';
import { MunAdminCMS } from '../components/cms/MunAdminCMS';
import { GenericCollectionCMS } from '../components/cms/GenericCollectionCMS';

// ---- Shared decorative background used by both the setup & login screens ----
// IMPORTANT: This must be declared OUTSIDE of AdminDashboardView. Defining it
// inside the component body creates a brand-new component type on every
// render, which makes React unmount/remount the entire subtree (including
// the email/password <input> fields) on every keystroke — that's what was
// causing the on-screen keyboard to close after each letter typed.
const AuthBackdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-16 overflow-hidden bg-slate-950">
    {/* Ambient gradient orbs for the glassmorphic backdrop */}
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl" />
    <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] bg-amber-500/20 rounded-full blur-3xl" />
    <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:28px_28px]" />
    <div className="relative z-10 w-full flex justify-center">{children}</div>
  </div>
);

export interface CMSSectionConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: (data: { applications: MembershipApplication[]; senators: Senator[] }) => number;
  renderComponent: (props: {
    cmsDataService: typeof CMSDataService;
    loadAllData: () => Promise<void>;
    showNotification: (text: string, type?: 'success' | 'error' | 'info') => void;
    siteSettings: SiteSettings;
    updateSiteSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
    applications: MembershipApplication[];
    senators: Senator[];
    leadership: LeadershipMember[];
    chapters: DistrictChapter[];
    events: EventItem[];
    news: NewsItem[];
    handleApproveApp: (appId: string) => Promise<void>;
    setActiveTab: (tabId: string) => void;
  }) => React.ReactNode;
}

export const AdminDashboardView: React.FC = () => {
  const {
    siteSettings, updateSiteSettings, refreshStats, showNotification, navigate,
    adminUser, adminAuthLoading, loginAdmin, logoutAdmin
  } = useYSP();

  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Ref to the horizontally-scrollable CMS module nav (used on both real
  // mobile devices and desktop browser windows narrower than the "lg"
  // breakpoint). Touch users can already swipe through it, but mouse
  // users on a PC/laptop have no easy way to scroll it — so on desktop we
  // also show small left/right arrow buttons that scroll it programmatically.
  const cmsNavScrollRef = useRef<HTMLElement>(null);
  const scrollCmsNav = (direction: 'left' | 'right') => {
    cmsNavScrollRef.current?.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  // Sign-in Form State (always starts empty — no credentials are ever hardcoded)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data States
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [senators, setSenators] = useState<Senator[]>([]);
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [chapters, setChapters] = useState<DistrictChapter[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const loadAllData = async () => {
    try {
      const [appData, senData, leadData, comData, chapData, evtData, newsData, msgData] = await Promise.all([
        fetchApi<MembershipApplication[]>('/applications'),
        fetchApi<Senator[]>('/senators'),
        fetchApi<LeadershipMember[]>('/leadership'),
        fetchApi<Committee[]>('/committees'),
        fetchApi<DistrictChapter[]>('/chapters'),
        fetchApi<EventItem[]>('/events'),
        fetchApi<NewsItem[]>('/news'),
        fetchApi<ContactMessage[]>('/contact')
      ]);

      // Overview tab, its "Pending Membership Applications" widget, and the
      // Membership Admin badge count are all Youth-Senate-specific — keep
      // MUN applications (applicationType === 'MUN') out of this state so a
      // MUN applicant can't get mistakenly "Approved & Inducted" as a
      // Senator from here. MUN applications have their own queue/actions in
      // MunAdminCMS.tsx, fed by its own filtered fetch.
      if (appData) setApplications(appData.filter(a => a.applicationType !== 'MUN'));
      if (senData) setSenators(senData);
      if (leadData) setLeadership(leadData);
      if (comData) setCommittees(comData);
      if (chapData) setChapters(chapData);
      if (evtData) setEvents(evtData);
      if (newsData) setNews(newsData);
      if (msgData) setMessages(msgData);
    } catch (e) {
      console.warn('Failed to load admin dataset', e);
    }
  };

  useEffect(() => {
    if (adminUser) loadAllData();
  }, [adminUser]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      await loginAdmin(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Application Approval Handler using CMSDataService
  const handleApproveApp = async (appId: string) => {
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) return;

      const newSenatorId = await CMSDataService.approveMembershipApplication(appId, app);

      showNotification(`Application approved & saved to Firestore! Inducted Senator ${app.fullName} (${newSenatorId})`, 'success');
      await loadAllData();
      await refreshStats();
    } catch (e) {
      showNotification('Failed to approve membership application.', 'error');
    }
  };

  /**
   * Configuration Object defining all editable CMS Sections
   */
  const CMS_SECTIONS_CONFIG: CMSSectionConfig[] = [
    {
      id: 'Overview',
      label: 'Dashboard Overview',
      icon: Layout,
      description: 'Central analytics and quick actions',
      badge: (d) => d.applications.filter(a => a.status === 'Submitted').length,
      renderComponent: (props) => (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Senators</span>
              <p className="text-2xl font-black text-slate-900">{props.senators.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Executive Body</span>
              <p className="text-2xl font-black text-emerald-800">{props.leadership.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Districts</span>
              <p className="text-2xl font-black text-amber-700">{props.chapters.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Apps</span>
              <p className="text-2xl font-black text-rose-700">{props.applications.filter(a => a.status === 'Submitted').length}</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Action Shortcuts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => props.setActiveTab('Senators')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition">
                + Add Youth Senator
              </button>
              <button onClick={() => props.setActiveTab('ExecutiveBody')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition">
                👑 Founder & President Photo
              </button>
              <button onClick={() => props.setActiveTab('Videos')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition">
                🎬 Upload Video
              </button>
              <button onClick={() => props.setActiveTab('Gallery')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 transition">
                📁 Media Repository
              </button>
            </div>
          </div>

          {/* Pending Membership Applications Review */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Pending Membership Applications ({props.applications.filter(a => a.status === 'Submitted').length})</span>
            </h3>

            {props.applications.filter(a => a.status === 'Submitted').length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                No pending membership applications at this time. All items synced with Firestore.
              </p>
            ) : (
              <div className="space-y-3">
                {props.applications.filter(a => a.status === 'Submitted').map(app => (
                  <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900">{app.fullName}</h4>
                      <p className="text-xs text-slate-600 font-medium">{app.district}, {app.province} | {app.phone}</p>
                      <p className="text-[11px] text-emerald-800 font-mono font-bold">Applied: {app.appliedDate}</p>
                    </div>

                    <button
                      onClick={() => props.handleApproveApp(app.id)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Approve & Induct Senator
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'MembershipAdmin',
      label: 'Membership Admin',
      icon: Award,
      description: 'Manage applications and memberships',
      badge: (d) => d.applications.filter(a => a.status === 'Submitted').length,
      renderComponent: () => <MembershipAdminCMS />
    },
    {
      id: 'MunAdmin',
      label: 'MUN Admin',
      icon: Globe2,
      description: 'Manage Youth MUN applications and members',
      renderComponent: () => <MunAdminCMS />
    },
    {
      id: 'Branding',
      label: 'Branding & Settings',
      icon: Globe,
      description: 'Site title, logos, and global configurations',
      renderComponent: () => <BrandingCMS />
    },
    {
      id: 'Homepage',
      label: 'Homepage Content',
      icon: Layout,
      description: 'Hero banners, vision, and mission text',
      renderComponent: () => <HomepageCMS />
    },
    {
      id: 'ExecutiveBody',
      label: 'Executive Leadership',
      icon: Users,
      description: 'Cabinet members, designations, and profiles',
      renderComponent: (props) => <LeadershipCMS onDataUpdated={props.loadAllData} />
    },
    {
      id: 'Senators',
      label: 'Youth Senators',
      icon: Users,
      description: 'Induct, edit, or delete Youth Senators',
      badge: (d) => d.senators.length,
      renderComponent: () => <SenatorCMS />
    },
    {
      id: 'Pages',
      label: 'Page Content Manager',
      icon: FileText,
      description: 'Edit content for all public pages',
      renderComponent: () => <PageContentCMS />
    },
    {
      id: 'Videos',
      label: 'Video Gallery CMS',
      icon: Film,
      description: 'Upload, edit, or delete video recordings',
      renderComponent: (props) => <VideoManagementCMS onNotification={props.showNotification} />
    },
    {
      id: 'EventsNews',
      label: 'Events & News',
      icon: Calendar,
      description: 'Publish press releases and upcoming conventions',
      renderComponent: () => <EventNewsCMS />
    },
    {
      id: 'Committees',
      label: 'Committees',
      icon: Building2,
      description: 'Standing committees, chairpersons, and mandates',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/committees"
          title="Committees"
          description="Manage standing committees, their chairpersons, and mandates."
          icon={Building2}
          idPrefix="comm"
          getItemTitle={(i) => i.name}
          getItemSubtitle={(i) => `Chaired by ${i.chairpersonName || 'TBA'}`}
          fields={[
            { key: 'name', label: 'Committee Name', type: 'text', required: true },
            { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. COM-01' },
            { key: 'category', label: 'Category', type: 'text', required: true },
            { key: 'chairpersonName', label: 'Chairperson Name', type: 'text', required: true },
            { key: 'chairpersonPhotoUrl', label: 'Chairperson Picture', type: 'image', imageFolder: 'youth-senate/committees' },
            { key: 'viceChairpersonName', label: 'Vice Chairperson Name', type: 'text' },
            { key: 'mandate', label: 'Mandate', type: 'textarea', required: true },
            { key: 'meetingSchedule', label: 'Meeting Schedule', type: 'text' },
            { key: 'memberCount', label: 'Member Count', type: 'number' },
            { key: 'coverImage', label: 'Cover Image URL (optional)', type: 'text', placeholder: 'Paste an existing image URL' }
          ]}
        />
      )
    },
    {
      id: 'Chapters',
      label: 'District Chapters',
      icon: Globe,
      description: 'District coordinators and chapter status',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/chapters"
          title="District Chapters"
          description="Manage district chapters, coordinators, and their status."
          icon={Globe}
          idPrefix="chap"
          getItemTitle={(i) => i.name}
          getItemSubtitle={(i) => `${i.province} — ${i.status}`}
          fields={[
            { key: 'name', label: 'District Name', type: 'text', required: true },
            {
              key: 'province', label: 'Province', type: 'select', required: true,
              options: ['Khyber Pakhtunkhwa', 'Punjab', 'Sindh', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir']
            },
            { key: 'coordinatorName', label: 'Coordinator / Chairman Name', type: 'text' },
            { key: 'coordinatorContact', label: 'Coordinator Contact', type: 'text' },
            { key: 'senatorCount', label: 'Senator Count', type: 'number' },
            { key: 'establishedDate', label: 'Established Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Forming'], required: true }
          ]}
        />
      )
    },
    {
      id: 'Sessions',
      label: 'Parliamentary Sessions',
      icon: Calendar,
      description: 'Senate sessions, agendas, and proceedings',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/sessions"
          title="Parliamentary Sessions"
          description="Manage upcoming and past Youth Senate sessions."
          icon={Calendar}
          idPrefix="sess"
          getItemTitle={(i) => i.title}
          getItemSubtitle={(i) => `${i.date} — ${i.status}`}
          fields={[
            { key: 'sessionNumber', label: 'Session Number', type: 'text', required: true },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'time', label: 'Time', type: 'text', placeholder: 'e.g. 10:00 AM' },
            { key: 'venue', label: 'Venue', type: 'text' },
            { key: 'host', label: 'Host', type: 'text' },
            { key: 'agenda', label: 'Agenda', type: 'textarea', required: true },
            { key: 'status', label: 'Status', type: 'select', options: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], required: true },
            { key: 'proceedingsSummary', label: 'Proceedings Summary', type: 'textarea' },
            { key: 'participantsCount', label: 'Participants Count', type: 'number' },
            { key: 'coverImage', label: 'Cover Image URL (optional)', type: 'text', placeholder: 'Paste an existing image URL' }
          ]}
        />
      )
    },
    {
      id: 'Publications',
      label: 'Publications',
      icon: FileText,
      description: 'Reports, newsletters, and official documents',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/publications"
          title="Publications"
          description="Manage downloadable reports, newsletters, and documents."
          icon={FileText}
          idPrefix="pub"
          getItemTitle={(i) => i.title}
          getItemSubtitle={(i) => i.category}
          fields={[
            { key: 'title', label: 'Title', type: 'text', required: true },
            {
              key: 'category', label: 'Category', type: 'select', required: true,
              options: ['Annual Reports', 'Session Reports', 'Committee Reports', 'Policy Recommendations', 'Research Papers', 'Newsletters', 'Magazines', 'Official Documents']
            },
            { key: 'publishDate', label: 'Publish Date', type: 'date', required: true },
            { key: 'description', label: 'Description', type: 'textarea', required: true },
            { key: 'coverImage', label: 'Cover Image URL (optional)', type: 'text', placeholder: 'Paste an existing image URL' },
            { key: 'fileUrl', label: 'File URL (PDF link)', type: 'text', required: true },
            { key: 'fileSize', label: 'File Size', type: 'text', placeholder: 'e.g. 2.4 MB' }
          ]}
        />
      )
    },
    {
      id: 'Gallery',
      label: 'Photo & Video Gallery',
      icon: Folder,
      description: 'Public gallery images and video links',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/gallery"
          title="Gallery"
          description="Manage public gallery photos and video entries."
          icon={Folder}
          idPrefix="gal"
          getItemTitle={(i) => i.title}
          getItemSubtitle={(i) => `${i.category} — ${i.mediaType}`}
          fields={[
            { key: 'title', label: 'Title', type: 'text', required: true },
            {
              key: 'category', label: 'Category', type: 'select', required: true,
              options: ['Sessions', 'Events', 'Leadership', 'Government Visits', 'Training', 'District Activities', 'Conferences', 'Youth Conventions']
            },
            { key: 'mediaType', label: 'Media Type', type: 'select', options: ['image', 'video'], required: true },
            { key: 'url', label: 'Photo or Video File', type: 'media', mediaTypeKey: 'mediaType', imageFolder: 'youth-senate/gallery', required: true },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'textarea' }
          ]}
        />
      )
    },
    {
      id: 'Resolutions',
      label: 'Resolutions',
      icon: FileText,
      description: 'Senate resolutions and their outcomes',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/resolutions"
          title="Resolutions"
          description="Manage formal resolutions passed by the Youth Senate."
          icon={FileText}
          idPrefix="res"
          getItemTitle={(i) => i.title}
          getItemSubtitle={(i) => `${i.resolutionNumber} — ${i.status}`}
          fields={[
            { key: 'resolutionNumber', label: 'Resolution Number', type: 'text', required: true },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'moverName', label: 'Mover Name', type: 'text', required: true },
            { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', required: true },
            { key: 'sessionTitle', label: 'Session Title', type: 'text' },
            { key: 'text', label: 'Resolution Text', type: 'textarea', required: true },
            { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'Under Review', 'Passed', 'Rejected', 'Withdrawn'], required: true },
            { key: 'outcome', label: 'Outcome', type: 'textarea' },
            { key: 'pdfUrl', label: 'PDF URL', type: 'text' }
          ]}
        />
      )
    },
    {
      id: 'Questions',
      label: 'Parliamentary Questions',
      icon: FileText,
      description: 'Member questions submitted and answered',
      renderComponent: () => (
        <GenericCollectionCMS
          endpoint="/questions"
          title="Parliamentary Questions"
          description="Manage questions submitted by Senators and their answers."
          icon={FileText}
          idPrefix="pq"
          getItemTitle={(i) => i.questionText?.slice(0, 60) + (i.questionText?.length > 60 ? '...' : '')}
          getItemSubtitle={(i) => `${i.memberName} — ${i.status}`}
          fields={[
            { key: 'memberName', label: 'Senator Name', type: 'text', required: true },
            { key: 'committeeName', label: 'Committee', type: 'text' },
            { key: 'questionText', label: 'Question Text', type: 'textarea', required: true },
            { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', required: true },
            { key: 'answerText', label: 'Answer', type: 'textarea' },
            { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'Under Review', 'Answered', 'Rejected'], required: true },
            { key: 'documentUrl', label: 'Document URL', type: 'text' }
          ]}
        />
      )
    }
  ];

  // ---- 1. Auth state still resolving: avoid flashing the login form ----
  if (adminAuthLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
        <div className="flex flex-col items-center gap-3 text-emerald-200">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Verifying secure session…</p>
        </div>
      </div>
    );
  }

  // ---- 2. Not signed in: secure sign-in screen ----
  if (!adminUser) {
    return (
      <AuthBackdrop>
        <div className="max-w-md w-full backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[2rem] p-8 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/90 to-emerald-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 bg-emerald-400/15 text-emerald-200 border border-emerald-300/30 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              Restricted Portal Access
            </span>
            <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
            <p className="text-xs text-white/60">
              Secured by Firebase Authentication. Sign in with your administrator account.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="you@youthsenate.pk"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white/15 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="px-4 py-2.5 bg-rose-500/15 border border-rose-400/30 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-amber-300" />}
              <span>Sign In to Admin Center</span>
              {!loggingIn && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <button
            onClick={() => navigate('home')}
            className="w-full text-center text-[11px] text-white/40 hover:text-white/70 transition"
          >
            ← Back to the public site
          </button>
        </div>
      </AuthBackdrop>
    );
  }

  const activeSection = CMS_SECTIONS_CONFIG.find(sec => sec.id === activeTab) || CMS_SECTIONS_CONFIG[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 text-slate-900 relative">
      {/* Ambient decorative gradient orbs for the glass aesthetic */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Admin Navigation Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/80 text-white border-b border-white/10 px-3.5 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center gap-3 shadow-lg shadow-slate-950/20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-2 truncate">
              <span className="truncate">ADMIN CONTROL CENTER</span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-black rounded-full uppercase backdrop-blur-sm shrink-0">
                Secured
              </span>
            </h1>
            <p className="hidden sm:block text-[11px] text-white/50">Youth Senate of Pakistan Central Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-white">{adminUser.name}</p>
            <p className="text-[10px] text-amber-300 font-semibold">{adminUser.email}</p>
          </div>

          <button
            onClick={logoutAdmin}
            className="px-2.5 sm:px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/90 text-rose-200 hover:text-white border border-rose-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition backdrop-blur-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/*
        NOTE: intentionally "relative" WITHOUT an explicit z-index here.
        Giving this wrapper its own z-index (it previously had "z-10")
        creates a brand-new stacking context, which then traps every
        fixed/modal element rendered inside it (like the "Upload New
        Video" dialog, its z-50 included) underneath the sticky top
        navbar above (which has "z-30" and lives in its own, separate,
        higher stacking context as a sibling). That's what was causing
        upload modals across the CMS to render jammed behind the navbar
        on desktop. Plain "relative" (no z-index) still paints above the
        earlier, lower fixed decorative orbs (DOM order decides that),
        but no longer boxes in child modals — so a modal's own z-50 is
        now compared directly against the navbar's z-30 and wins, as
        expected.
      */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative">
        {/* Mobile & Tablet: horizontal scrollable pill nav (hidden on desktop) */}
        <div className="lg:hidden -mx-4 px-4 sticky top-[72px] z-20 backdrop-blur-xl bg-white/80 border-b border-white/60 py-3 relative">
          {/*
            Left/right scroll arrows: only rendered for devices with a fine
            pointer + hover support (mouse/trackpad on a PC or laptop).
            Touch devices (phones/tablets) never match this media query, so
            they keep the plain swipe-to-scroll behaviour untouched — as
            requested, visible on PC only, not on mobile.
          */}
          <button
            type="button"
            onClick={() => scrollCmsNav('left')}
            aria-label="Scroll navigation left"
            className="hidden [@media(hover:hover)_and_(pointer:fine)]:flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:text-emerald-800 hover:shadow-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollCmsNav('right')}
            aria-label="Scroll navigation right"
            className="hidden [@media(hover:hover)_and_(pointer:fine)]:flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:text-emerald-800 hover:shadow-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <nav ref={cmsNavScrollRef} className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth [@media(hover:hover)_and_(pointer:fine)]:px-8">
            {CMS_SECTIONS_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badgeCount = tab.badge ? tab.badge({ applications, senators }) : 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md'
                      : 'bg-white/70 text-slate-700 border border-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop: Left Sidebar Navigation Tabs (hidden on mobile/tablet) */}
        <div className="hidden lg:block lg:col-span-3 backdrop-blur-xl bg-white/60 border border-white/60 rounded-3xl p-4 shadow-lg shadow-slate-900/5 space-y-2 sticky top-24 h-fit">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block">
            CMS MODULE NAVIGATION
          </span>

          <nav className="space-y-1">
            {CMS_SECTIONS_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badgeCount = tab.badge ? tab.badge({ applications, senators }) : 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Workspace Area - Rendering Active Functional Component from Config */}
        <div className="lg:col-span-9 space-y-6 sm:space-y-8">
          {activeSection.renderComponent({
            cmsDataService: CMSDataService,
            loadAllData,
            showNotification,
            siteSettings,
            updateSiteSettings,
            applications,
            senators,
            leadership,
            chapters,
            events,
            news,
            handleApproveApp,
            setActiveTab
          })}
        </div>
      </div>
    </div>
  );
};
