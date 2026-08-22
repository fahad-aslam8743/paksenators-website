import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { useYSP } from '../../context/YSPContext';
import { ImageUploader, ImageUploaderRef } from '../ImageUploader';
import { VideoUploader, VideoUploaderRef } from '../VideoUploader';
import { Plus, Edit, Trash2, Save, RefreshCw, X, LucideIcon } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'image' | 'media' | 'checkbox';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  imageFolder?: string;
  // For type 'media' only — the key of the sibling 'select' field
  // (e.g. mediaType: 'image' | 'video') that decides whether this field
  // shows the photo uploader or the video uploader.
  mediaTypeKey?: string;
}

interface GenericCollectionCMSProps {
  endpoint: string; // e.g. '/committees'
  title: string;
  description: string;
  icon: LucideIcon;
  fields: FieldConfig[];
  getItemTitle: (item: any) => string;
  getItemSubtitle?: (item: any) => string;
  idPrefix: string;
  defaultValues?: Record<string, any>;
}

export const GenericCollectionCMS: React.FC<GenericCollectionCMSProps> = ({
  endpoint,
  title,
  description,
  icon: Icon,
  fields,
  getItemTitle,
  getItemSubtitle,
  idPrefix,
  defaultValues = {}
}) => {
  const { showNotification } = useYSP();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const imageUploaderRefs = useRef<Record<string, ImageUploaderRef | null>>({});
  const videoUploaderRefs = useRef<Record<string, VideoUploaderRef | null>>({});

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any[]>(endpoint);
      setItems(data || []);
    } catch (e) {
      console.warn(`Failed to load ${endpoint}`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const initial: Record<string, any> = { ...defaultValues };
    fields.forEach(f => {
      if (!(f.key in initial)) {
        initial[f.key] = f.type === 'checkbox' ? true : f.type === 'number' ? 0 : '';
      }
    });
    setForm(initial);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setForm(item);
    setIsModalOpen(true);
  };

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Finalize any pending image uploads first (matches the working
      // pattern used elsewhere: select file -> upload happens on Save).
      const finalForm = { ...form };
      const imageFields = fields.filter(f => f.type === 'image');
      for (const f of imageFields) {
        const uploaderRef = imageUploaderRefs.current[f.key];
        if (uploaderRef) {
          const result = await uploaderRef.uploadImage();
          if (result) {
            finalForm[f.key] = result.downloadUrl;
          }
        }
      }

      // Finalize any pending 'media' uploads — these switch between the
      // photo uploader and the video uploader depending on the sibling
      // mediaType field, so we check which one is actually mounted.
      const mediaFields = fields.filter(f => f.type === 'media');
      for (const f of mediaFields) {
        const mediaType = finalForm[f.mediaTypeKey || 'mediaType'];
        if (mediaType === 'video') {
          const uploaderRef = videoUploaderRefs.current[f.key];
          if (uploaderRef) {
            const result = await uploaderRef.uploadVideo();
            if (result) {
              finalForm[f.key] = result.downloadUrl;
            }
          }
        } else {
          const uploaderRef = imageUploaderRefs.current[f.key];
          if (uploaderRef) {
            const result = await uploaderRef.uploadImage();
            if (result) {
              finalForm[f.key] = result.downloadUrl;
            }
          }
        }
      }

      let saved: any;
      if (editingId) {
        saved = await fetchApi(`${endpoint}/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(finalForm)
        });
        // Optimistic update: patch the item in place immediately instead
        // of waiting for a full reload round-trip.
        setItems(prev => prev.map(it => (it.id === editingId ? { ...it, ...finalForm } : it)));
        showNotification(`${getItemTitle(finalForm) || title} updated successfully!`, 'success');
      } else {
        const payload = { ...finalForm, id: `${idPrefix}-${Date.now()}` };
        saved = await fetchApi(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setItems(prev => [...prev, saved || payload]);
        showNotification(`${getItemTitle(finalForm) || title} added successfully!`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification(err.message || `Failed to save ${title}.`, 'error');
      // Re-sync with the server in case our optimistic assumption was wrong.
      await loadItems();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete "${getItemTitle(item)}"? This cannot be undone.`)) return;
    // Optimistic removal — item disappears immediately.
    const previousItems = items;
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await fetchApi(`${endpoint}/${item.id}`, { method: 'DELETE' });
      showNotification(`Deleted "${getItemTitle(item)}".`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete item.', 'error');
      setItems(previousItems); // roll back on failure
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 admin-glass-card">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading {title}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="admin-glass-card space-y-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
              <Icon className="w-4 h-4 text-emerald-600" />
              <span>{title} Manager</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{title} ({items.length})</h2>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
          <button onClick={handleOpenAdd} className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 admin-glass-card">
            No {title.toLowerCase()} yet. Click "Add New" to create one.
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className="admin-glass-card p-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{getItemTitle(item)}</h3>
            {getItemSubtitle && (
              <p className="text-[11px] text-slate-500 line-clamp-2">{getItemSubtitle(item)}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="flex-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/90 rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-5 sm:p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">{editingId ? `Edit ${title}` : `Add New ${title}`}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {f.label}{f.required && <span className="text-rose-500"> *</span>}
                  </label>

                  {f.type === 'textarea' && (
                    <textarea
                      value={form[f.key] ?? ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder}
                      rows={4}
                      className="admin-input"
                    />
                  )}

                  {f.type === 'text' && (
                    <input
                      type="text"
                      value={form[f.key] ?? ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="admin-input"
                    />
                  )}

                  {f.type === 'number' && (
                    <input
                      type="number"
                      value={form[f.key] ?? 0}
                      onChange={e => handleChange(f.key, Number(e.target.value))}
                      required={f.required}
                      className="admin-input"
                    />
                  )}

                  {f.type === 'date' && (
                    <input
                      type="date"
                      value={form[f.key] ?? ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      required={f.required}
                      className="admin-input"
                    />
                  )}

                  {f.type === 'select' && (
                    <select
                      value={form[f.key] ?? ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      required={f.required}
                      className="admin-input"
                    >
                      <option value="" disabled>Select {f.label}</option>
                      {f.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {f.type === 'checkbox' && (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!form[f.key]}
                        onChange={e => handleChange(f.key, e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-700"
                      />
                      <span>Enabled</span>
                    </label>
                  )}

                  {f.type === 'image' && (
                    <ImageUploader
                      ref={(el) => { imageUploaderRefs.current[f.key] = el; }}
                      label={`Upload ${f.label}`}
                      currentPhotoUrl={form[f.key] || ''}
                      folder={f.imageFolder || 'youth-senate/content'}
                      onDeletePhoto={() => handleChange(f.key, '')}
                    />
                  )}

                  {f.type === 'media' && (
                    form[f.mediaTypeKey || 'mediaType'] === 'video' ? (
                      <VideoUploader
                        ref={(el) => { videoUploaderRefs.current[f.key] = el; }}
                        label="Upload Original Video File"
                        currentVideoUrl={form[f.key] || ''}
                      />
                    ) : (
                      <ImageUploader
                        ref={(el) => { imageUploaderRefs.current[f.key] = el; }}
                        label={`Upload ${f.label}`}
                        currentPhotoUrl={form[f.key] || ''}
                        folder={f.imageFolder || 'youth-senate/content'}
                        onDeletePhoto={() => handleChange(f.key, '')}
                      />
                    )
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="admin-btn-primary flex-1">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Save Changes' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
