import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Session } from '../types/ysp';
import { Calendar, MapPin, Download, Users, FileText, CheckCircle2 } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const { navigate, currentViewParam } = useYSP();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Agenda' | 'Proceedings'>('Overview');

  useEffect(() => {
    fetchApi<Session[]>('/sessions').then(setSessions).catch(console.warn);
  }, []);

  if (currentViewParam) {
    const selected = sessions.find(s => s.id === currentViewParam);
    if (selected) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
          <button
            onClick={() => navigate('sessions')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            ← Back to Sessions List
          </button>

          <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-3">
            <span className="px-2.5 py-0.5 bg-amber-500 text-emerald-950 font-black text-xs rounded uppercase">
              {selected.sessionNumber} • {selected.status}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold">{selected.title}</h1>
            <p className="text-xs text-emerald-200">Date: {selected.date} | Time: {selected.time} | Venue: {selected.venue}</p>
          </div>

          {/* Session Detail Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            {(['Overview', 'Agenda', 'Proceedings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors ${
                  activeTab === tab ? 'bg-emerald-800 text-amber-300' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {activeTab === 'Overview' && (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <h3 className="text-base font-bold text-slate-900">Sitting Overview</h3>
                <p>Host: {selected.host}</p>
                <p>Expected Delegates: {selected.participantsCount} Senators</p>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-medium">
                  {selected.proceedingsSummary || 'Official proceedings draft undergoing final transcription.'}
                </div>
              </div>
            )}

            {activeTab === 'Agenda' && (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                <h3 className="text-base font-bold text-slate-900">Official Sitting Agenda</h3>
                <p>{selected.agenda}</p>
              </div>
            )}

            {activeTab === 'Proceedings' && (
              <div className="space-y-4 text-xs text-slate-700">
                <h3 className="text-base font-bold text-slate-900">Proceedings Summary & PDF</h3>
                <p>{selected.proceedingsSummary || 'No summary published yet.'}</p>
                <button
                  onClick={() => alert('Downloading official Session Proceedings PDF document...')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Proceedings PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Legislative Archive</span>
        <h1 className="text-3xl font-extrabold">Parliamentary Sessions</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Archive of upcoming, ongoing, and completed Youth Senate sittings and legislative assemblies.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map(sess => (
          <div key={sess.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="bg-emerald-900 text-amber-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                {sess.sessionNumber} • {sess.status}
              </span>
              <h3 className="text-base font-bold text-slate-900">{sess.title}</h3>
              <p className="text-xs text-slate-500">Date: {sess.date} | Venue: {sess.venue}</p>
            </div>
            <button
              onClick={() => navigate('sessions', sess.id)}
              className="px-4 py-2 border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white rounded text-xs font-bold uppercase shrink-0"
            >
              View Proceedings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
