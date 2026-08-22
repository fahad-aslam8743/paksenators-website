import React from 'react';
import { YSPProvider, useYSP } from './context/YSPContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useSEO } from './hooks/useSEO';
import { PAGE_SEO, DEFAULT_SEO } from './data/seo';

// Views
import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { FounderChairmanView } from './views/FounderChairmanView';
import { LeadershipView } from './views/LeadershipView';
import { YouthSenateView } from './views/YouthSenateView';
import { StructureView } from './views/StructureView';
import { CommitteesView } from './views/CommitteesView';
import { SenatorsView } from './views/SenatorsView';
import { DistrictChaptersView } from './views/DistrictChaptersView';
import { SessionsView } from './views/SessionsView';
import { EventsView } from './views/EventsView';
import { NewsView } from './views/NewsView';
import { PublicationsView } from './views/PublicationsView';
import { GalleryView } from './views/GalleryView';
import { VideoGalleryView } from './views/VideoGalleryView';
import { MembershipView } from './views/MembershipView';
import { MembershipApplyView } from './views/MembershipApplyView';
import { MunView } from './views/MunView';
import { MunApplyView } from './views/MunApplyView';
import { MemberPortalView } from './views/MemberPortalView';
import { CertificateVerifyView } from './views/CertificateVerifyView';
import { ConstitutionView } from './views/ConstitutionView';
import { DownloadsView } from './views/DownloadsView';
import { ResolutionsView } from './views/ResolutionsView';
import { QuestionsView } from './views/QuestionsView';
import { PolicyRecommendationsView } from './views/PolicyRecommendationsView';
import { ContactView } from './views/ContactView';
import { FAQView } from './views/FAQView';
import { DisclaimerView } from './views/DisclaimerView';
import { AdminDashboardView } from './views/AdminDashboardView';

const MainContent: React.FC = () => {
  const { currentView, notificationMessage } = useYSP();

  // Sets document.title, meta description, Open Graph & Twitter tags for
  // whichever page is currently active — see src/data/seo.ts for the
  // per-page content.
  useSEO(PAGE_SEO[currentView] || DEFAULT_SEO);

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'about': return <AboutView />;
      case 'founder': return <FounderChairmanView />;
      case 'leadership': return <LeadershipView />;
      case 'youth-senate': return <YouthSenateView />;
      case 'structure': return <StructureView />;
      case 'committees': return <CommitteesView />;
      case 'senators': return <SenatorsView />;
      case 'chapters': return <DistrictChaptersView />;
      case 'sessions': return <SessionsView />;
      case 'events': return <EventsView />;
      case 'news': return <NewsView />;
      case 'publications': return <PublicationsView />;
      case 'gallery': return <GalleryView />;
      case 'videos': 
      case 'video-gallery': return <VideoGalleryView />;
      case 'membership': return <MembershipView />;
      case 'apply': return <MembershipApplyView />;
      case 'mun': return <MunView />;
      case 'mun-apply': return <MunApplyView />;
      case 'portal': return <MemberPortalView />;
      case 'verify': return <CertificateVerifyView />;
      case 'constitution': return <ConstitutionView />;
      case 'downloads': return <DownloadsView />;
      case 'resolutions': return <ResolutionsView />;
      case 'questions': return <QuestionsView />;
      case 'policy': return <PolicyRecommendationsView />;
      case 'contact': return <ContactView />;
      case 'faq': return <FAQView />;
      case 'disclaimer': return <DisclaimerView />;
      case 'admin': return <AdminDashboardView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Header />

      {/* Notification Banner */}
      {notificationMessage && (
        <div className={`py-2 px-4 text-center text-xs font-bold text-white shadow-md transition-all ${
          notificationMessage.type === 'error' ? 'bg-red-700' : 'bg-emerald-800 border-b border-amber-400'
        }`}>
          {notificationMessage.text}
        </div>
      )}

      <main className="flex-grow">
        {renderView()}
      </main>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <YSPProvider>
      <MainContent />
    </YSPProvider>
  );
}

export default App;
