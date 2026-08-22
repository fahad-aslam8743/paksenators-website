import React, { useState, useEffect, useRef } from 'react';
import { LeadershipMember } from '../types/ysp';
import { 
  deleteImageFromFirebase
} from '../lib/firebaseStorage';
import { fetchApi } from '../lib/api';
import { ImageUploader, ImageUploaderRef } from './ImageUploader';
import { useYSP } from '../context/YSPContext';
import { 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  X
} from 'lucide-react';

const CATEGORIES: LeadershipMember['category'][] = [
  'Founder Chairman',
  'President',
  'Vice President',
  'Finance Secretary',
  'Joint Secretary',
  'Press Secretary',
  'Office Secretary',
  'Chairman',
  'Deputy Chairman',
  'Leader of the House',
  'Standing Committee Chairpersons',
  'District Presidents',
  'District Secretaries',
  'Other Executive Members',
  'Executive Council',
  'Provincial Leadership',
  'District Leadership'
];

interface Props {
  onDataUpdated?: () => void;
}

export const LeadershipCMS: React.FC<Props> = ({ onDataUpdated }) => {
  const { showNotification } = useYSP();
  const imageUploaderRef = useRef<ImageUploaderRef>(null);

  const [leadershipList, setLeadershipList] = useState<LeadershipMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filter category
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<Partial<LeadershipMember>>({
    name: '',
    designation: '',
    category: 'Executive Council',
    photoUrl: '',
    photoStoragePath: '',
    province: 'Islamabad Capital Territory',
    district: 'Islamabad',
    biography: '',
    message: '',
    order: 10,
    isActive: true
  });

  const fetchLeadershipData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<LeadershipMember[]>('/leadership');
      setLeadershipList(data || []);
    } catch (err: any) {
      console.error('Error loading leadership:', err);
      showNotification('Failed to load leadership profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadershipData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      designation: '',
      category: 'President',
      photoUrl: '',
      photoStoragePath: '',
      province: 'Islamabad Capital Territory',
      district: 'Islamabad',
      biography: '',
      message: '',
      order: leadershipList.length + 1,
      isActive: true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: LeadershipMember) => {
    setEditingId(member.id);
    setFormData({ ...member });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showNotification('Leader Name is required.', 'error');
      return;
    }

    setSaving(true);
    setUploadError(null);

    let finalPhotoUrl = formData.photoUrl || '';
    let finalStoragePath = formData.photoStoragePath || '';

    try {
      // Execute upload via ImageUploader component if user picked a new file
      if (imageUploaderRef.current) {
        const uploadRes = await imageUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalPhotoUrl = uploadRes.downloadUrl;
          finalStoragePath = uploadRes.storagePath;
        }
      }

      const idToSave = editingId || `lead-fs-${Date.now()}`;

      const payload: LeadershipMember = {
        id: idToSave,
        name: formData.name || '',
        designation: formData.designation || '',
        category: (formData.category as any) || 'Executive Council',
        photoUrl: finalPhotoUrl || '',
        photoStoragePath: finalStoragePath,
        province: formData.province || '',
        district: formData.district || '',
        biography: formData.biography || '',
        message: formData.message || '',
        order: Number(formData.order) || 10,
        isActive: formData.isActive ?? true,
        isDemo: false,
        updatedAt: new Date().toISOString()
      };

      // Save via the server API — this is the single source of truth that
      // the server keeps in memory, on disk, and synced to Firestore.
      if (editingId) {
        await fetchApi(`/leadership/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/leadership', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      showNotification(`Leadership profile for "${payload.name}" saved successfully!`);
      setIsModalOpen(false);
      await fetchLeadershipData();
      if (onDataUpdated) onDataUpdated();

    } catch (error: any) {
      console.error('Error saving leadership member:', error);
      setUploadError(error.message || 'An error occurred while saving profile.');
      showNotification(error.message || 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (member: LeadershipMember) => {
    if (!window.confirm(`Are you sure you want to permanently delete profile for "${member.name}"?`)) {
      return;
    }

    try {
      if (member.photoStoragePath) {
        await deleteImageFromFirebase(member.photoStoragePath);
      }
      await fetchApi(`/leadership/${member.id}`, { method: 'DELETE' });

      showNotification(`Deleted profile "${member.name}".`);
      await fetchLeadershipData();
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete leadership record.', 'error');
    }
  };

  const filteredList = selectedCategoryFilter === 'All'
    ? leadershipList
    : leadershipList.filter(l => l.category === selectedCategoryFilter);

  return (
    <div className="space-y-6">
      
      {/* CMS Header Bar */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl border-2 border-amber-400 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-black text-[10px] uppercase rounded mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firebase Storage + Cloud Firestore Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Leadership Profiles & Photo Management</h2>
          <p className="text-xs text-emerald-200">
            Upload, replace, and edit photos for Founder Chairman, President, Vice President, Secretaries, Committee Chairs, and District Leaders with permanent cloud storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchLeadershipData}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-amber-300 font-bold text-xs uppercase rounded-lg border border-amber-400/40 flex items-center gap-1.5 transition-colors"
            title="Refresh Firestore Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Firestore</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-xs uppercase rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Leadership Member</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 shrink-0">Filter by Category:</span>
        <button
          onClick={() => setSelectedCategoryFilter('All')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
            selectedCategoryFilter === 'All'
              ? 'bg-emerald-900 text-amber-300'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          All ({leadershipList.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = leadershipList.filter(l => l.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-900 text-amber-300'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Leadership Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading Leadership Profiles from Firestore...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No profiles found for "{selectedCategoryFilter}"</p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold uppercase rounded hover:bg-emerald-900"
          >
            Create Profile Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map(member => (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex gap-4 items-start">
                  <img
                    src={member.photoUrl || '/src/assets/images/irfan_mateen_original_1786443966305.jpg'}
                    alt={member.name}
                    className="w-20 h-24 object-cover object-top rounded-xl border-2 border-emerald-800 shadow bg-slate-100 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase rounded">
                      {member.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-xs font-bold text-amber-700">{member.designation}</p>
                    <p className="text-[11px] text-slate-500">
                      {member.province} {member.district ? `• ${member.district}` : ''}
                    </p>
                  </div>
                </div>

                {member.message && (
                  <div className="bg-slate-50 p-3 rounded-lg border text-[11px] text-slate-700 italic leading-relaxed line-clamp-2">
                    "{member.message}"
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <span>Order: #{member.order}</span>
                  <span>•</span>
                  <span className={member.photoStoragePath ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {member.photoStoragePath ? 'Firebase Storage' : 'URL Image'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] rounded flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit Profile / Upload Photo</span>
                  </button>

                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-20 sm:pt-24 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-2 border-emerald-800 shadow-2xl overflow-hidden my-8 space-y-0 text-xs">
            
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-5 flex justify-between items-center border-b-2 border-amber-400">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Firebase Storage & Firestore CMS</span>
                <h3 className="text-lg font-black text-white">
                  {editingId ? `Edit Profile: ${formData.name}` : 'Add New Leadership Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMember} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {uploadError && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* REUSABLE IMAGE UPLOADER */}
              <ImageUploader
                ref={imageUploaderRef}
                currentPhotoUrl={formData.photoUrl || ''}
                currentStoragePath={formData.photoStoragePath || ''}
                folder="youth-senate/leadership"
                label="Official Leadership Photo (Firebase Storage)"
                onError={(err) => setUploadError(err)}
              />

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Irfan Mateen / Haroon Mateen"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Designation / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Founder Chairman / President"
                    value={formData.designation || ''}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Leadership Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500 font-bold text-emerald-950"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Display Order (Sorting)</label>
                  <input
                    type="number"
                    value={formData.order || 10}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Province / Territory</label>
                  <select
                    value={formData.province || 'Islamabad Capital Territory'}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                  >
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">District / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Islamabad / Peshawar / Lahore"
                    value={formData.district || ''}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Official Quote / Message</label>
                <textarea
                  rows={2}
                  placeholder="Official message to youth and senators..."
                  value={formData.message || ''}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Biography & Achievements</label>
                <textarea
                  rows={3}
                  placeholder="Detailed profile biography..."
                  value={formData.biography || ''}
                  onChange={e => setFormData({ ...formData, biography: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-lg border">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-800 rounded"
                />
                <span className="font-bold text-slate-800">Active Profile (Visible on Public Pages)</span>
              </label>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black uppercase rounded-lg shadow-lg flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Firebase Storage & Firestore...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Profile permanently</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
