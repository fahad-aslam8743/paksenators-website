import React, { useState } from 'react';
import { SiteSettings } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { Layout, Save, RefreshCw, Sparkles, CheckSquare, Square, Eye } from 'lucide-react';

export const HomepageCMS: React.FC = () => {
  const { siteSettings, updateSiteSettings, showNotification } = useYSP();
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSiteSettings(formData);
      showNotification('Homepage content & layout updated successfully!', 'success');
    } catch (err) {
      showNotification('Failed to save homepage settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 admin-glass-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Layout className="w-4 h-4 text-emerald-600" />
            <span>Homepage Content Manager</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Homepage Content & Hero Banner</h2>
          <p className="text-xs text-slate-500 mt-1">
            Update main hero headlines, taglines, vision & mission statements displayed on the homepage.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 admin-btn-primary flex items-center gap-2 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Homepage Updates</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Hero Headline & Subtitle */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            Hero Section Banner & Copy
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Main Hero Headline</label>
            <input
              type="text"
              name="heroHeadline"
              value={formData.heroHeadline}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Subheadline Tagline</label>
            <input
              type="text"
              name="heroSubheadline"
              value={formData.heroSubheadline}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-sm font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Overview Paragraph</label>
            <textarea
              name="heroDescription"
              rows={3}
              value={formData.heroDescription}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Hero Background / Banner Image (read-only preview — upload removed) */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Hero Banner Image
          </h3>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 block">Current Hero Asset:</span>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
              <img
                src={formData.heroImageUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg'}
                alt="Hero Banner"
                className="w-24 h-24 object-cover rounded-lg border border-slate-200"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">Homepage Hero Graphic</span>
                <p className="text-[11px] text-slate-500 mt-1">Managed via the Branding & Settings section.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission Statements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Vision Statement</label>
            <textarea
              name="visionStatement"
              rows={4}
              value={formData.visionStatement}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Mission Statement</label>
            <textarea
              name="missionStatement"
              rows={4}
              value={formData.missionStatement}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Homepage Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
