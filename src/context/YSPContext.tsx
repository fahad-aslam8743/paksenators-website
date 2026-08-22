import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SiteSettings, SystemUser, AdminUser } from '../types/ysp';
import { translations } from '../lib/translations';
import { fetchApi } from '../lib/api';
import { initialSiteSettings } from '../data/initialData';
import {
  loginAdmin as loginAdminRequest,
  logoutAdmin as logoutAdminRequest,
  watchAdminAuthState
} from '../lib/adminAuth';

/**
 * Lightweight pathname <-> view-key router. This keeps every existing
 * `navigate('someView', param)` call across the app working unchanged while
 * giving every page (including the admin panel) a real, bookmarkable,
 * shareable, back/forward-button-aware URL such as `/admin` or
 * `/senators/sen-102`.
 */
const parseLocation = (): { view: string; param?: string } => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return { view: 'home' };
  const [view, param] = path.split('/');
  return { view: view || 'home', param: param ? decodeURIComponent(param) : undefined };
};

const buildPath = (view: string, param?: string): string => {
  if (view === 'home' && !param) return '/';
  return `/${view}${param ? `/${encodeURIComponent(param)}` : ''}`;
};

interface StatsData {
  senatorsCount: number;
  districtChaptersCount: number;
  standingCommitteesCount: number;
  sessionsCount: number;
  eventsCount: number;
  certificatesCount: number;
  membersApplicationsCount: number;
}

interface YSPContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
  currentView: string;
  currentViewParam?: string;
  navigate: (view: string, param?: string) => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  stats: StatsData;
  refreshStats: () => Promise<void>;
  currentUser: SystemUser | null;
  setCurrentUser: (user: SystemUser | null) => void;
  logout: () => void;
  notificationMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (text: string, type?: 'success' | 'error' | 'info') => void;

  // Secure Firebase-backed admin panel session (fully independent from the
  // member/senator portal session above).
  adminUser: AdminUser | null;
  adminAuthLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<AdminUser>;
  logoutAdmin: () => Promise<void>;
}

const YSPContext = createContext<YSPContextType | undefined>(undefined);

export const YSPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<string>(() => parseLocation().view);
  const [currentViewParam, setCurrentViewParam] = useState<string | undefined>(() => parseLocation().param);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
  const [stats, setStats] = useState<StatsData>({
    senatorsCount: 0,
    districtChaptersCount: 0,
    standingCommitteesCount: 0,
    sessionsCount: 0,
    eventsCount: 0,
    certificatesCount: 0,
    membersApplicationsCount: 0
  });
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(true);

  const isRtl = language === 'ur';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.dir = lang === 'ur' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const navigate = (view: string, param?: string) => {
    setCurrentView(view);
    setCurrentViewParam(param);
    const path = buildPath(view, param);
    if (window.location.pathname !== path) {
      window.history.pushState({ view, param }, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMessage({ text, type });
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const loadSettings = async () => {
    try {
      const data = await fetchApi<SiteSettings>('/settings');
      if (data) setSiteSettings(data);
    } catch (e) {
      console.warn('Using default settings fallback');
    }
  };

  const refreshStats = async () => {
    try {
      const data = await fetchApi<StatsData>('/stats');
      if (data) setStats(data);
    } catch (e) {
      console.warn('Failed to load stats');
    }
  };

  const updateSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const updated = await fetchApi<SiteSettings>('/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings)
      });
      setSiteSettings(updated);
      showNotification('Site settings updated successfully.');
    } catch (e: any) {
      showNotification(e.message || 'Failed to update settings', 'error');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    showNotification('Logged out successfully.', 'info');
    navigate('home');
  };

  // ---- Secure Admin Panel Authentication (Firebase Auth) ----

  const loginAdmin = async (email: string, password: string): Promise<AdminUser> => {
    const profile = await loginAdminRequest(email, password);
    setAdminUser(profile);
    showNotification(`Welcome back, ${profile.name}.`, 'success');
    return profile;
  };

  const logoutAdmin = async (): Promise<void> => {
    await logoutAdminRequest();
    setAdminUser(null);
    showNotification('Signed out of the admin panel.', 'info');
    navigate('home');
  };

  // Sync browser Back/Forward buttons with in-app view state.
  useEffect(() => {
    const onPopState = () => {
      const { view, param } = parseLocation();
      setCurrentView(view);
      setCurrentViewParam(param);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Persist the admin panel session across page refreshes via Firebase's
  // own auth state, and re-verify authorization against Firestore each time.
  useEffect(() => {
    const unsubscribe = watchAdminAuthState(user => {
      setAdminUser(user);
      setAdminAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadSettings();
    refreshStats();
  }, []);

  return (
    <YSPContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRtl,
        currentView,
        currentViewParam,
        navigate,
        siteSettings,
        updateSiteSettings,
        stats,
        refreshStats,
        currentUser,
        setCurrentUser,
        logout,
        notificationMessage,
        showNotification,
        adminUser,
        adminAuthLoading,
        loginAdmin,
        logoutAdmin
      }}
    >
      {children}
    </YSPContext.Provider>
  );
};

export const useYSP = (): YSPContextType => {
  const context = useContext(YSPContext);
  if (!context) {
    throw new Error('useYSP must be used within a YSPProvider');
  }
  return context;
};
