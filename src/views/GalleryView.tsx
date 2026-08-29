import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { GalleryItem } from '../types/ysp';
import { useYSP } from '../context/YSPContext';
import { Film, Image as ImageIcon } from 'lucide-react';

export const GalleryView: React.FC = () => {
  const { navigate } = useYSP();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetchApi<GalleryItem[]>('/gallery').then(setGallery).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Visual Archives</span>
          <h1 className="text-3xl font-extrabold">Photo & Video Gallery</h1>
          <p className="text-xs text-emerald-100 max-w-2xl">
            Highlights from Youth Senate parliamentary assemblies, committee meetings, and district conventions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('photo-collections')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl border border-white/30 flex items-center gap-1.5 transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Collections</span>
          </button>
          <button
            onClick={() => navigate('videos')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Film className="w-4 h-4" />
            <span>Switch to Video Gallery</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {gallery.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedImage(item)}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="relative h-48">
              {item.mediaType === 'video' ? (
                <>
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Film className="w-5 h-5 text-emerald-900" />
                    </div>
                  </div>
                </>
              ) : (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase">{item.category} • {item.date}</span>
              <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24" onClick={() => setSelectedImage(null)}>
          <div className="max-w-3xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl p-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white font-bold text-lg">✕</button>
            {selectedImage.mediaType === 'video' ? (
              <video
                src={selectedImage.url}
                controls
                autoPlay
                playsInline
                className="w-full h-96 object-contain rounded-lg bg-black"
              />
            ) : (
              <img src={selectedImage.url} alt={selectedImage.title} className="w-full h-96 object-contain rounded-lg" />
            )}
            <div className="pt-4">
              <h3 className="text-lg font-bold">{selectedImage.title}</h3>
              <p className="text-xs text-slate-400">{selectedImage.category} • {selectedImage.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
