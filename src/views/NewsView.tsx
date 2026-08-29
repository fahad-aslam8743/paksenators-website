import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { NewsItem } from '../types/ysp';
import { Calendar, User, Share2 } from 'lucide-react';

export const NewsView: React.FC = () => {
  const { navigate, currentViewParam } = useYSP();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchApi<NewsItem[]>('/news').then(setNews).catch(console.warn);
  }, []);

  if (currentViewParam) {
    const selected = news.find(n => n.id === currentViewParam || n.slug === currentViewParam);
    if (selected) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 bg-slate-50 text-slate-900">
          <button
            onClick={() => navigate('news')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase"
          >
            ← Back to News & Press Releases
          </button>

          <div className="space-y-3">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] uppercase rounded">
              {selected.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">{selected.title}</h1>
            <div className="text-xs text-slate-500 flex items-center gap-4">
              <span>By {selected.author}</span>
              <span>•</span>
              <span>{selected.date}</span>
            </div>
          </div>

          <img src={selected.imageUrl} alt={selected.title} className="w-full h-80 object-cover rounded-2xl shadow-md" />

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-line">
            {selected.content}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Official Press Desk</span>
        <h1 className="text-3xl font-extrabold">News & Press Releases</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Official statements, media coverage, and session announcements from Youth Senate of Pakistan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-600">{item.category} • {item.date}</span>
              <h3 className="text-base font-bold text-slate-900 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-3">{item.excerpt}</p>
              <button
                onClick={() => navigate('news', item.id)}
                className="text-xs font-bold text-emerald-800 hover:text-amber-600 pt-2 block"
              >
                Read Full Release →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
