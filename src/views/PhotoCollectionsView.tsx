import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { GalleryCollection } from '../types/ysp';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

export const PhotoCollectionsView: React.FC = () => {
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [openCollection, setOpenCollection] = useState<GalleryCollection | null>(null);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    fetchApi<GalleryCollection[]>('/gallery-collections').then(setCollections).catch(console.warn);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Images className="w-4 h-4" />
          Visual Archives
        </span>
        <h1 className="text-3xl font-extrabold">Photo Collections</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Curated photo albums from Youth Senate sessions, events, and district conventions.
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">No photo collections published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(col => (
            <div
              key={col.id}
              onClick={() => { setOpenCollection(col); setOpenIndex(0); }}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-lg transition-shadow group"
            >
              <div className="relative grid grid-cols-2 grid-rows-2 h-56 gap-0.5 bg-slate-100">
                {col.photoUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className={`relative overflow-hidden ${col.photoUrls.length === 1 ? 'col-span-2 row-span-2' : ''}`}>
                    <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
                {col.photoUrls.length > 4 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                    +{col.photoUrls.length - 4} more
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase">{col.photoUrls.length} Photos • {col.date}</span>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{col.title}</h3>
                {col.description && <p className="text-xs text-slate-500 line-clamp-2">{col.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {openCollection && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4" onClick={() => setOpenCollection(null)}>
          <div className="max-w-4xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpenCollection(null)} className="absolute top-4 right-4 z-10 text-white font-bold text-lg bg-black/40 rounded-full w-8 h-8 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>

            <div className="relative bg-black h-[60vh] flex items-center justify-center">
              <img
                src={openCollection.photoUrls[openIndex]}
                alt={openCollection.title}
                className="max-w-full max-h-full object-contain"
              />
              {openCollection.photoUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setOpenIndex(i => (i - 1 + openCollection.photoUrls.length) % openCollection.photoUrls.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setOpenIndex(i => (i + 1) % openCollection.photoUrls.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="p-5 space-y-2">
              <h3 className="text-lg font-bold">{openCollection.title}</h3>
              {openCollection.description && <p className="text-sm text-slate-300">{openCollection.description}</p>}
              <p className="text-xs text-slate-500">{openIndex + 1} of {openCollection.photoUrls.length} photos</p>

              <div className="flex gap-2 overflow-x-auto pt-2">
                {openCollection.photoUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setOpenIndex(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === openIndex ? 'border-amber-400' : 'border-transparent opacity-70'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
