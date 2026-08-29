import React from 'react';
import { Download, FileText } from 'lucide-react';

export const DownloadsView: React.FC = () => {
  const documents = [
    { title: 'Official Membership Application Form', size: '1.2 MB', category: 'Forms' },
    { title: 'Parliamentary Rules of Procedure Guidebook', size: '2.5 MB', category: 'Rules' },
    { title: 'Youth Senate Resolution Draft Template', size: '0.8 MB', category: 'Forms' },
    { title: 'Annual Youth Senate Report 2025', size: '4.1 MB', category: 'Reports' },
    { title: 'Standing Committee Guidelines', size: '1.9 MB', category: 'Rules' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Resource Portal</span>
        <h1 className="text-3xl font-extrabold">Document Repository & Downloads</h1>
        <p className="text-xs text-emerald-100 max-w-xl">
          Download official forms, parliamentary guidebooks, committee regulations, and session proceedings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">
                {doc.category}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-slate-500">{doc.size}</span>
              <button
                onClick={() => alert(`Downloading ${doc.title}...`)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[10px] uppercase flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
