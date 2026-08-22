import React, { useState, useEffect, useRef } from 'react';
import { Senator } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
import { ImageUploader, ImageUploaderRef } from '../ImageUploader';
import { Users, Plus, Edit, Trash2, Save, RefreshCw, CheckCircle2, ShieldCheck, Search, Filter, AlertCircle } from 'lucide-react';

export const SenatorCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [senators, setSenators] = useState<Senator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // REUSABLE IMAGE UPLOADER ref — same working pattern as Executive Leadership.
  const imageUploaderRef = useRef<ImageUploaderRef>(null);

  // Modal / Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Senator>>({
    membershipId: 'YSP-SEN-00',
    name: '',
    designation: 'Youth Senator',
    district: 'Islamabad',
    province: 'Islamabad Capital Territory',
    photoUrl: '/src/assets/images/ysp_official_logo_1786441197850.jpg',
    joiningDate: new Date().toISOString().split('T')[0],
    validUntil: '2028-12-31',
    biography: 'Active Youth Senator engaged in parliamentary debates and community service.',
    parliamentaryRole: 'Member of Standing Committee',
    attendancePercentage: 95,
    sessionsAttendedCount: 5,
    eventsAttendedCount: 8,
    certificatesCount: 2,
    status: 'Active',
    email: 'senator@youthsenate.pk'
  });

  const loadSenators = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Senator[]>('/senators');
      if (data) setSenators(data);
    } catch (e) {
      console.warn('Failed to load senators', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSenators();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadError(null);
    setForm({
      membershipId: `YSP-SEN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      designation: 'Youth Senator',
      district: 'Peshawar',
      province: 'Khyber Pakhtunkhwa',
      photoUrl: '/src/assets/images/ysp_official_logo_1786441197850.jpg',
      joiningDate: new Date().toISOString().split('T')[0],
      validUntil: '2028-12-31',
      biography: 'Youth Senator committed to democratic principles.',
      parliamentaryRole: 'Youth Representative',
      attendancePercentage: 90,
      sessionsAttendedCount: 4,
      eventsAttendedCount: 6,
      certificatesCount: 1,
      status: 'Active',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (senator: Senator) => {
    setEditingId(senator.id);
    setForm(senator);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.membershipId) return;

    setSaving(true);
    setUploadError(null);

    try {
      // Execute the photo upload (if a new file was selected) via the
      // ImageUploader component — same working pattern as Executive Leadership.
      let finalPhotoUrl = form.photoUrl || '';
      if (imageUploaderRef.current) {
        const uploadRes = await imageUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalPhotoUrl = uploadRes.downloadUrl;
        }
      }

      const payload = { ...form, photoUrl: finalPhotoUrl };
      setForm(payload);

      if (editingId) {
        await fetchApi(`/senators/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification(`Senator ${form.name} updated!`, 'success');
      } else {
        await fetchApi('/senators', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification(`New Senator ${form.name} added!`, 'success');
      }
      setIsModalOpen(false);
      loadSenators();
    } catch (e: any) {
      const msg = e.message || 'Failed to save senator details.';
      setUploadError(msg);
      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate Senator ${name}?`)) return;
    try {
      await fetchApi(`/senators/${id}`, { method: 'DELETE' });
      showNotification(`Senator ${name} removed.`, 'success');
      loadSenators();
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete senator.', 'error');
    }
  };

  const filtered = senators.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.membershipId.toLowerCase().includes(search.toLowerCase()) || s.district.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Senators Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 admin-glass-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Youth Senators Directory Control</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Youth Senators Manager ({senators.length})</h2>
          <p className="text-xs text-slate-500 mt-1">
            Induct, edit, de-activate, or update profiles & official photographs for all Youth Senators.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 admin-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Induct New Youth Senator</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Senator by name, ID, or district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Active', 'Inactive', 'Suspended'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === st ? 'bg-emerald-950 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Senators Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(senator => (
          <div key={senator.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs relative">
            <div className="flex items-start gap-4">
              <img
                src={senator.photoUrl}
                alt={senator.name}
                className="w-16 h-16 rounded-xl object-cover object-top border-2 border-slate-200 shadow-xs shrink-0"
              />
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                  {senator.membershipId}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{senator.name}</h4>
                <p className="text-xs font-bold text-amber-700">{senator.district}, {senator.province}</p>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-1">
              <p className="text-slate-600 font-medium"><span className="font-bold">Role:</span> {senator.parliamentaryRole}</p>
              <p className="text-slate-600 font-medium"><span className="font-bold">Joined:</span> {senator.joiningDate}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                senator.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {senator.status}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(senator)}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(senator.id, senator.name)}
                  className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              {editingId ? 'Edit Youth Senator Details' : 'Induct New Youth Senator'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {uploadError && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Membership ID</label>
                  <input
                    type="text"
                    value={form.membershipId}
                    onChange={e => setForm(prev => ({ ...prev, membershipId: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">District</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={e => setForm(prev => ({ ...prev, district: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Province / Region</label>
                  <select
                    value={form.province}
                    onChange={e => setForm(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  >
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Official Photo Upload</span>
                <ImageUploader
                  ref={imageUploaderRef}
                  label="Upload Senator Photo"
                  currentPhotoUrl={form.photoUrl}
                  folder="youth-senate/senators"
                  onError={(err) => setUploadError(err)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Senator Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
