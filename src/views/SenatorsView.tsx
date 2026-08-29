import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Senator } from '../types/ysp';
import { Search, MapPin, Award, Calendar, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';

export const SenatorsView: React.FC = () => {
  const { navigate, currentViewParam } = useYSP();
  const [senators, setSenators] = useState<Senator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All');

  useEffect(() => {
    fetchApi<Senator[]>('/senators').then(setSenators).catch(console.warn);
  }, []);

  // Detail view if parameter is passed
  if (currentViewParam) {
    const selected = senators.find(s => s.id === currentViewParam || s.membershipId === currentViewParam);
    if (selected) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
          <button
            onClick={() => navigate('senators')}
            className="text-xs font-bold text-emerald-800 hover:text-amber-600 uppercase flex items-center gap-1"
          >
            ← Back to Senators Directory
          </button>

          <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 flex flex-col md:flex-row gap-8 items-center">
            <img
              src={selected.photoUrl}
              alt={selected.name}
              className="w-40 h-40 rounded-2xl object-cover object-[center_15%] border-4 border-amber-400 shadow-2xl shrink-0"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500 text-emerald-950 font-black text-xs rounded-full uppercase">
                  {selected.membershipId}
                </span>
                <span className="text-xs text-emerald-300 font-bold">• {selected.status}</span>
              </div>
              <h1 className="text-3xl font-extrabold">{selected.name}</h1>
              <p className="text-amber-400 font-bold text-sm">{selected.designation} — District {selected.district}, {selected.province}</p>
              <p className="text-xs text-emerald-200">{selected.committeeName || 'Standing Committee Representative'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Parliamentary Biography</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selected.biography}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Parliamentary Role & Responsibilities</h3>
                <p className="text-xs text-slate-600">{selected.parliamentaryRole}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Record & Statistics</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-bold text-slate-800">{selected.joiningDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Attendance Rate:</span>
                  <span className="font-bold text-emerald-700">{selected.attendancePercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sessions Attended:</span>
                  <span className="font-bold text-slate-800">{selected.sessionsAttendedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Events Attended:</span>
                  <span className="font-bold text-slate-800">{selected.eventsAttendedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Certificates Issued:</span>
                  <span className="font-bold text-amber-600">{selected.certificatesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const provinces = [
    'All',
    'Khyber Pakhtunkhwa',
    'Punjab',
    'Sindh',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu & Kashmir'
  ];

  const filtered = senators.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.membershipId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProv = selectedProvince === 'All' || s.province === selectedProvince;
    return matchesSearch && matchesProv;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">National Registry</span>
        <h1 className="text-3xl font-extrabold">Senators Directory</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Search and view active Youth Senators representing districts across Pakistan.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, district, ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {provinces.map(p => (
            <button
              key={p}
              onClick={() => setSelectedProvince(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selectedProvince === p ? 'bg-emerald-800 text-amber-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(sen => (
          <div key={sen.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img src={sen.photoUrl} alt={sen.name} className="w-full h-52 object-cover object-[center_15%]" />
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  {sen.membershipId}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">{sen.attendancePercentage}% Att.</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{sen.name}</h3>
              <p className="text-xs text-slate-500">{sen.district}, {sen.province}</p>
              <p className="text-xs text-slate-600 line-clamp-2">{sen.biography}</p>
              <button
                onClick={() => navigate('senators', sen.id)}
                className="w-full py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded text-center transition-colors pt-2"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
