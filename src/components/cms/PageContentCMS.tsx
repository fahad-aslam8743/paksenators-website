import React, { useState, useEffect } from 'react';
import { PageContent } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
import { FileText, Save, RefreshCw, Eye, CheckCircle2, Globe, Search } from 'lucide-react';

export const PageContentCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activePage, setActivePage] = useState<PageContent>({
    id: 'home',
    pageName: 'Home Page',
    slug: 'home',
    title: "Empowering Pakistan's Youth Through Parliamentary Democracy",
    subtitle: "Learn. Debate. Lead. Serve.",
    content: "Youth Senate of Pakistan provides a structured platform for young people...",
    isPublished: true
  });

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<PageContent[]>('/pages');
      if (data) {
        setPages(data);
        if (data.length > 0) {
          const home = data.find(p => p.id === 'home') || data[0];
          setSelectedPageId(home.id);
          setActivePage(home);
        }
      }
    } catch (e) {
      console.warn('Failed to load pages data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleSelectPage = (id: string) => {
    setSelectedPageId(id);
    const p = pages.find(item => item.id === id);
    if (p) setActivePage(p);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updated: PageContent;
      try {
        updated = await fetchApi<PageContent>(`/pages/${activePage.id}`, {
          method: 'PUT',
          body: JSON.stringify(activePage)
        });
      } catch {
        // Fallback: page doesn't exist yet server-side, create it
        updated = await fetchApi<PageContent>('/pages', {
          method: 'POST',
          body: JSON.stringify(activePage)
        });
      }
      setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      showNotification(`Page "${activePage.pageName}" saved successfully!`, 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to save page changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Page Content Manager...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Sidebar Page Selection List */}
      <div className="lg:col-span-4 admin-glass-card space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Website Pages Index ({pages.length})</span>
        </div>

        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPage(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                selectedPageId === p.id
                  ? 'bg-emerald-950 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <h4 className="text-xs font-bold">{p.pageName}</h4>
                <p className={`text-[10px] ${selectedPageId === p.id ? 'text-emerald-300' : 'text-slate-500'}`}>
                  /{p.slug}
                </p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                p.isPublished
                  ? selectedPageId === p.id ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {p.isPublished ? 'Published' : 'Draft'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Content Editor Box */}
      <div className="lg:col-span-8 admin-glass-card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">Editing Page Content</span>
            <h2 className="text-xl font-extrabold text-slate-900">{activePage.pageName}</h2>
          </div>

          <button
            onClick={handleSavePage}
            disabled={saving}
            className="px-5 py-2.5 admin-btn-primary flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Page Changes</span>
          </button>
        </div>

        <form onSubmit={handleSavePage} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Page Name (CMS Identifier)</label>
              <input
                type="text"
                value={activePage.pageName}
                onChange={e => setActivePage(prev => ({ ...prev, pageName: e.target.value }))}
                required
                className="w-full px-4 py-2 admin-input text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">URL Route Slug</label>
              <input
                type="text"
                value={activePage.slug}
                onChange={e => setActivePage(prev => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full px-4 py-2 admin-input text-xs font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Page Display Title (H1 Header)</label>
            <input
              type="text"
              value={activePage.title}
              onChange={e => setActivePage(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-4 py-2.5 admin-input text-base font-extrabold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Page Subtitle / Tagline</label>
            <input
              type="text"
              value={activePage.subtitle}
              onChange={e => setActivePage(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-4 py-2 admin-input text-sm font-semibold text-emerald-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Main Content Body Text / Description</label>
            <textarea
              rows={8}
              value={activePage.content}
              onChange={e => setActivePage(prev => ({ ...prev, content: e.target.value }))}
              required
              className="w-full px-4 py-3 admin-input text-xs font-medium leading-relaxed"
            />
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-3 p-4 admin-input">
            <input
              type="checkbox"
              id="isPublished"
              checked={activePage.isPublished}
              onChange={e => setActivePage(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-500"
            />
            <label htmlFor="isPublished" className="text-xs font-bold text-slate-900 cursor-pointer">
              Publish page publicly on Youth Senate website
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Page Content</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
