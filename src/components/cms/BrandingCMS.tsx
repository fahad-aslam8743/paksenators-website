import React, { useState, useRef } from 'react';
import { SiteSettings } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { ImageUploader, ImageUploaderRef } from '../ImageUploader';
import { Globe, Building2, Save, RefreshCw, CheckCircle2, ShieldCheck, Image as ImageIcon, AlertCircle } from 'lucide-react';

const DEFAULT_LOGO = '/images/ysp_official_logo_1786441197850.jpg';

export const BrandingCMS: React.FC = () => {
  const { siteSettings, updateSiteSettings, showNotification } = useYSP();
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // REUSABLE IMAGE UPLOADER — same ref-based pattern used by the working
  // Executive Leadership CMS. The file is only actually uploaded to
  // Firebase Storage when the form is saved (imageUploaderRef.current.uploadImage()).
  const logoUploaderRef = useRef<ImageUploaderRef>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);

    try {
      // Execute the logo upload (if a new file was selected) via the
      // ImageUploader component, exactly like Executive Leadership does.
      let finalLogoUrl = formData.logoUrl || '';

      if (logoUploaderRef.current) {
        const uploadRes = await logoUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalLogoUrl = uploadRes.downloadUrl;
        }
      }

      const updatedSettings: SiteSettings = { ...formData, logoUrl: finalLogoUrl };
      setFormData(updatedSettings);

      // siteSettings is shared site-wide, so this single save updates the
      // logo everywhere it's used — both the header and the footer.
      await updateSiteSettings(updatedSettings);
      showNotification('Website branding & general settings updated successfully! The logo is now updated in both the header and footer.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Failed to save settings. Please try again.';
      setUploadError(msg);
      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: DEFAULT_LOGO }));
  };

  return (
    <div className="space-y-8 admin-glass-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Brand Identity & General Control</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Website Branding Control</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization titles, header & footer logos, official contact details, and disclaimers.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 admin-btn-primary flex items-center gap-2 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Branding Settings</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {uploadError && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Basic Brand Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Organization Full Name</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Short Abbreviation / Acronym</label>
            <input
              type="text"
              name="organizationShortName"
              value={formData.organizationShortName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Logo Uploaders */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span>Official Logo & Favicon Management (Exact File Upload - No AI)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            This logo is used site-wide — it appears in both the header navigation bar and the site footer. Select a new photo below, then click "Save Branding Settings" to publish it everywhere.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">Current Official Logo Preview:</span>
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                <img
                  src={formData.logoUrl || DEFAULT_LOGO}
                  alt="Official Logo"
                  className="w-20 h-20 object-contain rounded-lg border border-slate-200 p-1 bg-white shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{formData.organizationName}</h4>
                  <p className="text-xs text-slate-500">Used in Navigation Bar, Official Certificates & Footer</p>
                  <span className="mt-1 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    Official High-Res Asset
                  </span>
                </div>
              </div>
            </div>

            <ImageUploader
              ref={logoUploaderRef}
              label="Upload New Official Logo"
              currentPhotoUrl={formData.logoUrl || DEFAULT_LOGO}
              folder="youth-senate/branding"
              onDeletePhoto={handleResetLogo}
              onError={(err) => setUploadError(err)}
            />
          </div>
        </div>

        {/* Official Contact Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            Secretariat Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Email Address</label>
              <input
                type="email"
                name="officialEmail"
                value={formData.officialEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Phone / Helpline</label>
              <input
                type="text"
                name="officialPhone"
                value={formData.officialPhone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Central Office Address</label>
            <input
              type="text"
              name="officeAddress"
              value={formData.officeAddress}
              onChange={handleChange}
              className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Office Working Hours</label>
            <input
              type="text"
              name="officeHours"
              value={formData.officeHours}
              onChange={handleChange}
              className="w-full px-4 py-2.5 admin-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Legal Disclaimer & Financials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Bank / EasyPaisa Payment Account Details</label>
            <textarea
              name="bankPaymentDetails"
              rows={3}
              value={formData.bankPaymentDetails}
              onChange={handleChange}
              className="w-full px-4 py-2.5 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Legal Non-Partisan Disclaimer</label>
            <textarea
              name="legalDisclaimer"
              rows={3}
              value={formData.legalDisclaimer}
              onChange={handleChange}
              className="w-full px-4 py-2.5 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <span>Save All Branding Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
