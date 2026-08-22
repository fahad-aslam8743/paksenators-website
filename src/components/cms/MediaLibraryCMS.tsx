import React, { useState, useEffect } from 'react';
import { MediaItem } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
import { ImageUploader } from '../ImageUploader';
import { VideoUploader } from '../VideoUploader';
import { Folder, Search, Copy, Check, Trash2, ExternalLink, Image as ImageIcon, Film, FileText, UploadCloud, RefreshCw } from 'lucide-react';

export const MediaLibraryCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'image' | 'video' | 'logo' | 'document'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<MediaItem[]>('/media');
      if (data) setMediaList(data);
    } catch (e) {
      console.warn('Failed to load media library', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotification('Media URL copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (item: MediaItem) => {
    if (item.usedIn && item.usedIn.length > 0) {
      const confirmDelete = window.confirm(
        `WARNING: This file is currently used in: ${item.usedIn.join(', ')}.\nAre you sure you want to delete it?`
      );
      if (!confirmDelete) return;
    } else {
      if (!window.confirm(`Delete media asset "${item.title}"?`)) return;
    }

    try {
      await fetchApi(`/media/${item.id}`, { method: 'DELETE' });
      setMediaList(prev => prev.filter(m => m.id !== item.id));
      showNotification('Media asset deleted.', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete media asset.', 'error');
    }
  };

  const filtered = mediaList.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Media Repository...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 admin-glass-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Folder className="w-4 h-4 text-emerald-600" />
            <span>Central Media Repository</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Media Library ({mediaList.length})</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage all uploaded official photos, logos, video files, and documents across the website.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-emerald-700" />
          <span>Upload New Asset to Central Repository</span>
        </h3>

        <ImageUploader
          label="Upload High-Res Photograph / Logo to Central Storage"
          folder="youth-senate/media-library"
          onUploadSuccess={async (url, path) => {
            const newMedia = {
              title: `Uploaded Asset ${new Date().toLocaleTimeString()}`,
              type: 'image',
              url,
              storagePath: path,
              fileSize: '1.4 MB',
              usedIn: ['Media Repository']
            };
            await fetchApi('/media', {
              method: 'POST',
              body: JSON.stringify(newMedia)
            });
            loadMedia();
            showNotification('New asset saved to Central Media Library!', 'success');
          }}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search media by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          {(['ALL', 'image', 'video', 'logo', 'document'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                typeFilter === t
                  ? 'bg-emerald-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col justify-between">
            <div>
              <div className="h-44 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                )}

                <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                  {item.type}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                <p className="text-[10px] text-slate-500">Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}</p>

                {item.usedIn && item.usedIn.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.usedIn.map((u, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-bold">
                        {u}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleCopyUrl(item.url, item.id)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
              >
                {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === item.id ? 'Copied' : 'Copy URL'}</span>
              </button>

              <button
                onClick={() => handleDelete(item)}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
