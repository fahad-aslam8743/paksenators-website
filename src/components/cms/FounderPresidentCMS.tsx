import React, { useState, useEffect } from 'react';
import { LeadershipMember } from '../../types/ysp';
import { deleteImageFromFirebase } from '../../lib/firebaseStorage';
import { fetchApi } from '../../lib/api';
import { ImageUploader } from '../ImageUploader';
import { useYSP } from '../../context/YSPContext';
import { UserCheck, Save, RefreshCw, Mail, Phone, ShieldCheck, Quote } from 'lucide-react';

export const FounderPresidentCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [loading, setLoading] = useState(true);
  const [savingFounder, setSavingFounder] = useState(false);
  const [savingPresident, setSavingPresident] = useState(false);
  const [savingVP, setSavingVP] = useState(false);

  // Founder Chairman State
  const [founder, setFounder] = useState<LeadershipMember>({
    id: 'lead-01',
    name: 'Irfan Mateen',
    designation: 'Founder Chairman',
    category: 'Founder Chairman',
    photoUrl: '/images/irfan_mateen_original_1786443966305.jpg',
    province: 'Islamabad Capital Territory',
    district: 'Islamabad',
    biography: 'Irfan Mateen is the visionary Founder Chairman of Youth Senate of Pakistan.',
    message: 'Pakistan\'s future rests in the hands of its vibrant youth.',
    email: 'chairman@youthsenate.pk',
    order: 1,
    isActive: true
  });

  // President State
  const [president, setPresident] = useState<LeadershipMember>({
    id: 'lead-02',
    name: 'Haroon Mateen',
    designation: 'President',
    category: 'President',
    photoUrl: '/images/haroon_mateen_president_1786445857055.jpg',
    province: 'Khyber Pakhtunkhwa / Islamabad',
    district: 'Peshawar / Islamabad',
    phone: '0343-2810025',
    email: 'president@youthsenate.pk',
    biography: 'Haroon Mateen is the President of Youth Senate of Pakistan (بااختیار نوجوان، مضبوط پاکستان).',
    message: 'Youth empowerment, constructive civic debate, and democratic leadership are essential.',
    order: 2,
    isActive: true
  });

  // Vice President State
  const [vicePresident, setVicePresident] = useState<LeadershipMember>({
    id: 'lead-03',
    name: 'Vice President YSP',
    designation: 'Vice President',
    category: 'Vice President',
    photoUrl: '/images/ysp_official_logo_1786441197850.jpg',
    province: 'Punjab / Islamabad',
    district: 'Lahore / Islamabad',
    phone: '0300-0000000',
    email: 'vp@youthsenate.pk',
    biography: 'Vice President of Youth Senate of Pakistan overseeing parliamentary committees and provincial chapters.',
    message: 'Fostering youth integration and institutional discipline across all parliamentary committees.',
    order: 3,
    isActive: true
  });

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const list = await fetchApi<LeadershipMember[]>('/leadership');
      if (list) {
        const fc = list.find(l => l.category === 'Founder Chairman' || l.name.includes('Irfan Mateen'));
        const pr = list.find(l => l.category === 'President' || l.name.includes('Haroon Mateen'));
        const vp = list.find(l => l.category === 'Vice President');
        if (fc) setFounder(fc);
        if (pr) setPresident(pr);
        if (vp) setVicePresident(vp);
      }
    } catch (e) {
      console.warn('Failed to load founder/president profiles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSaveFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFounder(true);
    try {
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(founder)
      });
      showNotification('Founder Chairman Irfan Mateen profile updated successfully!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to save Founder Chairman profile.', 'error');
    } finally {
      setSavingFounder(false);
    }
  };

  const handleSavePresident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPresident(true);
    try {
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(president)
      });
      showNotification('President Haroon Mateen profile updated successfully!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to save President profile.', 'error');
    } finally {
      setSavingPresident(false);
    }
  };

  const handleSaveVicePresident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVP(true);
    try {
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(vicePresident)
      });
      showNotification('Vice President profile updated successfully!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to save Vice President profile.', 'error');
    } finally {
      setSavingVP(false);
    }
  };

  const handleDeleteFounderPhoto = async () => {
    if (!window.confirm('Are you sure you want to delete the photograph for Founder Chairman Irfan Mateen?')) {
      return;
    }
    const previousStoragePath = founder.photoStoragePath;
    const updated = { ...founder, photoUrl: '', photoStoragePath: '' };
    try {
      // Save the record FIRST. Only once Firestore has confirmed the
      // photo reference is cleared do we delete the actual Storage file —
      // never before. If this save fails, the old photo file is still
      // intact and the live record still points at it, so nothing is
      // left broken.
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
      setFounder(updated);
      if (previousStoragePath) {
        deleteImageFromFirebase(previousStoragePath).catch(err => console.warn('Storage delete warning:', err));
      }
      showNotification('Founder Chairman photo deleted and saved to database!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete Founder Chairman photo.', 'error');
    }
  };

  const handleDeletePresidentPhoto = async () => {
    if (!window.confirm('Are you sure you want to delete the photograph for President Haroon Mateen?')) {
      return;
    }
    const previousStoragePath = president.photoStoragePath;
    const updated = { ...president, photoUrl: '', photoStoragePath: '' };
    try {
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
      setPresident(updated);
      if (previousStoragePath) {
        deleteImageFromFirebase(previousStoragePath).catch(err => console.warn('Storage delete warning:', err));
      }
      showNotification('President photo deleted and saved to database!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete President photo.', 'error');
    }
  };

  const handleDeleteVPPhoto = async () => {
    if (!window.confirm('Are you sure you want to delete the photograph for Vice President?')) {
      return;
    }
    const previousStoragePath = vicePresident.photoStoragePath;
    const updated = { ...vicePresident, photoUrl: '', photoStoragePath: '' };
    try {
      await fetchApi('/leadership', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
      setVicePresident(updated);
      if (previousStoragePath) {
        deleteImageFromFirebase(previousStoragePath).catch(err => console.warn('Storage delete warning:', err));
      }
      showNotification('Vice President photo deleted and saved to database!', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete Vice President photo.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Founder & President Profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 1. FOUNDER CHAIRMAN SECTION */}
      <div className="admin-glass-card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400 text-amber-700 flex items-center justify-center font-black text-lg">
              👑
            </div>
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">Top Leadership Control</span>
              <h2 className="text-xl font-extrabold text-slate-900">Founder Chairman Management (Irfan Mateen)</h2>
            </div>
          </div>

          <button
            onClick={handleSaveFounder}
            disabled={savingFounder}
            className="px-5 py-2 admin-btn-primary flex items-center gap-2"
          >
            {savingFounder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Founder Changes</span>
          </button>
        </div>

        <form onSubmit={handleSaveFounder} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Image Upload Box */}
            <div className="lg:col-span-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Profile Photograph</span>
              <div className="relative group">
                <img
                  src={founder.photoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                  alt={founder.name}
                  className="w-full h-64 object-cover object-[center_15%] rounded-xl border-2 border-slate-200 shadow-md bg-white"
                />
                {founder.photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteFounderPhoto}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1"
                  >
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>

              <ImageUploader
                label="Upload Founder Photo (Exact Original File)"
                currentPhotoUrl={founder.photoUrl}
                folder="youth-senate/leadership"
                onDeletePhoto={handleDeleteFounderPhoto}
                onUploadSuccess={async (url, path) => {
                  const previous = founder;
                  const updated = { ...founder, photoUrl: url, photoStoragePath: path };
                  // Optimistic: reflect the new photo immediately...
                  setFounder(updated);
                  try {
                    await fetchApi('/leadership', {
                      method: 'POST',
                      body: JSON.stringify(updated)
                    });
                    showNotification('Founder Chairman photograph uploaded and saved successfully!', 'success');
                  } catch (e: any) {
                    // ...Firestore rejected it — roll back and say so; never
                    // claim success when the save actually failed.
                    setFounder(previous);
                    showNotification(e.message || 'Failed to save Founder Chairman photo.', 'error');
                  }
                }}
              />
            </div>

            {/* Fields Box */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={founder.name}
                    onChange={e => setFounder(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Designation Title</label>
                  <input
                    type="text"
                    value={founder.designation}
                    onChange={e => setFounder(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    value={founder.email || ''}
                    onChange={e => setFounder(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Phone / Mobile</label>
                  <input
                    type="text"
                    value={founder.phone || ''}
                    onChange={e => setFounder(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Founder's Message</label>
                <textarea
                  rows={3}
                  value={founder.message || ''}
                  onChange={e => setFounder(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium italic"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Biography & Background</label>
                <textarea
                  rows={4}
                  value={founder.biography}
                  onChange={e => setFounder(prev => ({ ...prev, biography: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 2. PRESIDENT SECTION */}
      <div className="admin-glass-card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400 text-emerald-800 flex items-center justify-center font-black text-lg">
              👔
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">Executive Leadership Control</span>
              <h2 className="text-xl font-extrabold text-slate-900">President Management (Haroon Mateen)</h2>
            </div>
          </div>

          <button
            onClick={handleSavePresident}
            disabled={savingPresident}
            className="px-5 py-2 admin-btn-primary flex items-center gap-2"
          >
            {savingPresident ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save President Changes</span>
          </button>
        </div>

        <form onSubmit={handleSavePresident} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Image Upload Box */}
            <div className="lg:col-span-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Profile Photograph</span>
              <div className="relative group">
                <img
                  src={president.photoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                  alt={president.name}
                  className="w-full h-64 object-cover object-[center_15%] rounded-xl border-2 border-slate-200 shadow-md bg-white"
                />
                {president.photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePresidentPhoto}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1"
                  >
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>

              <ImageUploader
                label="Upload President Photo (Exact Original File)"
                currentPhotoUrl={president.photoUrl}
                folder="youth-senate/leadership"
                onDeletePhoto={handleDeletePresidentPhoto}
                onUploadSuccess={async (url, path) => {
                  const previous = president;
                  const updated = { ...president, photoUrl: url, photoStoragePath: path };
                  setPresident(updated);
                  try {
                    await fetchApi('/leadership', {
                      method: 'POST',
                      body: JSON.stringify(updated)
                    });
                    showNotification('President photograph uploaded and saved successfully!', 'success');
                  } catch (e: any) {
                    setPresident(previous);
                    showNotification(e.message || 'Failed to save President photo.', 'error');
                  }
                }}
              />
            </div>

            {/* Fields Box */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={president.name}
                    onChange={e => setPresident(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Designation Title</label>
                  <input
                    type="text"
                    value={president.designation}
                    onChange={e => setPresident(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Mobile / Phone Number</label>
                  <input
                    type="text"
                    value={president.phone || ''}
                    onChange={e => setPresident(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-bold text-emerald-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    value={president.email || ''}
                    onChange={e => setPresident(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Presidential Message / Slogan</label>
                <textarea
                  rows={3}
                  value={president.message || ''}
                  onChange={e => setPresident(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium italic"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Biography & Executive Overview</label>
                <textarea
                  rows={4}
                  value={president.biography}
                  onChange={e => setPresident(prev => ({ ...prev, biography: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 3. VICE PRESIDENT SECTION */}
      <div className="admin-glass-card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400 text-blue-800 flex items-center justify-center font-black text-lg">
              🎖️
            </div>
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block">Executive Leadership Control</span>
              <h2 className="text-xl font-extrabold text-slate-900">Vice President Management</h2>
            </div>
          </div>

          <button
            onClick={handleSaveVicePresident}
            disabled={savingVP}
            className="px-5 py-2 admin-btn-primary flex items-center gap-2"
          >
            {savingVP ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Vice President Changes</span>
          </button>
        </div>

        <form onSubmit={handleSaveVicePresident} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Image Upload Box */}
            <div className="lg:col-span-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Profile Photograph</span>
              <div className="relative group">
                <img
                  src={vicePresident.photoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                  alt={vicePresident.name}
                  className="w-full h-64 object-cover object-[center_15%] rounded-xl border-2 border-slate-200 shadow-md bg-white"
                />
                {vicePresident.photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteVPPhoto}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1"
                  >
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>

              <ImageUploader
                label="Upload Vice President Photo"
                currentPhotoUrl={vicePresident.photoUrl}
                folder="youth-senate/leadership"
                onDeletePhoto={handleDeleteVPPhoto}
                onUploadSuccess={async (url, path) => {
                  const previous = vicePresident;
                  const updated = { ...vicePresident, photoUrl: url, photoStoragePath: path };
                  setVicePresident(updated);
                  try {
                    await fetchApi('/leadership', {
                      method: 'POST',
                      body: JSON.stringify(updated)
                    });
                    showNotification('Vice President photograph uploaded and saved successfully!', 'success');
                  } catch (e: any) {
                    setVicePresident(previous);
                    showNotification(e.message || 'Failed to save Vice President photo.', 'error');
                  }
                }}
              />
            </div>

            {/* Fields Box */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={vicePresident.name}
                    onChange={e => setVicePresident(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Designation Title</label>
                  <input
                    type="text"
                    value={vicePresident.designation}
                    onChange={e => setVicePresident(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-sm font-bold text-blue-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Mobile / Phone Number</label>
                  <input
                    type="text"
                    value={vicePresident.phone || ''}
                    onChange={e => setVicePresident(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    value={vicePresident.email || ''}
                    onChange={e => setVicePresident(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vice President's Message</label>
                <textarea
                  rows={3}
                  value={vicePresident.message || ''}
                  onChange={e => setVicePresident(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium italic"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Biography & Role Description</label>
                <textarea
                  rows={4}
                  value={vicePresident.biography}
                  onChange={e => setVicePresident(prev => ({ ...prev, biography: e.target.value }))}
                  className="w-full px-4 py-2 admin-input text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
