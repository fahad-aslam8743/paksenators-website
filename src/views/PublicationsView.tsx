import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Publication } from '../types/ysp';
import { Download, FileText } from 'lucide-react';

export const PublicationsView: React.FC = () => {
  const { showNotification } = useYSP();
  const [pubs, setPubs] = useState<Publication[]>([]);

  useEffect(() => {
    fetchApi<Publication[]>('/publications').then(setPubs).catch(console.warn);
  }, []);

  const handleDownload = async (id: string, title: string) => {
    try {
      await fetchApi(`/publications/${id}/download`, { method: 'POST' });
      showNotification(`Downloading ${title}...`);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Document Repository</span>
        <h1 className="text-3xl font-extrabold">Publications & Reports</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Annual reviews, committee reports, research policy papers, and parliamentary guidebooks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pubs.map(pub => (
          <div key={pub.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">
                {pub.category}
              </span>
              <h3 className="text-base font-bold text-slate-900">{pub.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-3">{pub.description}</p>
            </div>

            <div className="pt-3 border-t text-xs flex items-center justify-between">
              <span className="text-slate-500">{pub.fileSize} • {pub.downloadCount} Downloads</span>
              <button
                onClick={() => handleDownload(pub.id, pub.title)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[10px] uppercase flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
