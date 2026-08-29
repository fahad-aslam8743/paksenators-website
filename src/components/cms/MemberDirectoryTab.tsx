import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, ChevronDown, ListChecks, Wrench, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useYSP } from '../../context/YSPContext';
import { Committee } from '../../types/ysp';
import { exportDirectory, DirectoryRow, ExportFormat } from '../../lib/directoryExport';

export interface DirectoryMember {
  id: string;
  name: string;
  fatherName?: string;
  cnicNumber?: string;
  committeeName?: string;
  mobileNumber?: string;
  address?: string;
  province?: string;
  district?: string;
}

interface MemberDirectoryTabProps {
  members: DirectoryMember[];
  memberLabel: string; // "Senator" or "MUN Member"
  orgTitle?: string;
  logoUrl?: string;
  // Called after the "Fix Missing Data" backfill completes successfully,
  // so the parent (which owns the actual senators/mun-members state) can
  // re-fetch and show the newly-filled-in data immediately, instead of
  // requiring a manual page refresh.
  onDataFixed?: () => void;
}

const PROVINCES = [
  'Khyber Pakhtunkhwa', 'Punjab', 'Sindh', 'Balochistan',
  'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir'
];

/** Small dropdown attached to a download button — pick PDF / Excel / Word. */
const FormatMenu: React.FC<{ onPick: (f: ExportFormat) => void; label: string; busy: boolean }> = ({ onPick, label, busy }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {(['pdf', 'excel', 'word'] as ExportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => { onPick(f); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {f === 'pdf' ? 'PDF' : f === 'excel' ? 'Excel (.xlsx)' : 'Word (.doc)'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const MemberDirectoryTab: React.FC<MemberDirectoryTabProps> = ({
  members,
  memberLabel,
  orgTitle = 'YOUTH SENATE OF PAKISTAN',
  // Nonexistent-path bug: this used to point at '/src/assets/images/
  // ysp_crest_logo.jpg', a file that never actually existed in the
  // project and also used the dev-only '/src/assets/...' path that
  // breaks in production (see public/images fix elsewhere). Default to
  // the real official logo, served from public/images so it works in
  // both dev and production.
  logoUrl = '/images/ysp_official_logo_1786441197850.jpg',
  onDataFixed
}) => {
  const { showNotification } = useYSP();
  const [fixingData, setFixingData] = useState(false);

  const handleFixMissingData = async () => {
    setFixingData(true);
    try {
      const result = await fetchApi<{ updatedCount: number; message: string }>('/admin/backfill-senator-cnic', { method: 'POST' });
      showNotification(result?.message || 'Done.', 'success');
      onDataFixed?.();
    } catch (e: any) {
      showNotification(e?.message || 'Failed to fix missing data. Please try again.', 'error');
    } finally {
      setFixingData(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [committeeFilter, setCommitteeFilter] = useState('All');
  const [exportBusy, setExportBusy] = useState(false);

  // The committee filter shows every REAL Standing Committee that exists
  // (from the admin-managed Committees page), not just whichever ones
  // happen to already be assigned to a member — so a newly created
  // committee is selectable immediately, even before anyone's assigned
  // to it yet, and the names always match the official spelling.
  const [allCommittees, setAllCommittees] = useState<Committee[]>([]);
  useEffect(() => {
    fetchApi<Committee[]>('/committees').then(setAllCommittees).catch(() => {});
  }, []);

  const districts = useMemo(() => {
    const set = new Set(members.map(m => m.district).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [members]);

  const committees = useMemo(() => {
    // Union of the official committee names and any distinct values found
    // on members directly — the latter covers the rare case of an older
    // free-text committee name that doesn't exactly match a current
    // committee record, so it still shows up as a selectable filter
    // rather than silently disappearing.
    const set = new Set<string>(allCommittees.map(c => c.name));
    members.forEach(m => { if (m.committeeName) set.add(m.committeeName); });
    return Array.from(set).sort();
  }, [members, allCommittees]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return members.filter(m => {
      const matchesSearch = !term ||
        m.name?.toLowerCase().includes(term) ||
        m.fatherName?.toLowerCase().includes(term) ||
        m.cnicNumber?.toLowerCase().includes(term) ||
        m.mobileNumber?.toLowerCase().includes(term) ||
        m.district?.toLowerCase().includes(term) ||
        m.committeeName?.toLowerCase().includes(term);
      const matchesProvince = provinceFilter === 'All' || m.province === provinceFilter;
      const matchesDistrict = districtFilter === 'All' || m.district === districtFilter;
      const matchesCommittee = committeeFilter === 'All' || m.committeeName === committeeFilter;
      return matchesSearch && matchesProvince && matchesDistrict && matchesCommittee;
    });
  }, [members, searchTerm, provinceFilter, districtFilter, committeeFilter]);

  const toRows = (): DirectoryRow[] =>
    filtered.map((m, i) => ({
      serial: i + 1,
      name: m.name || '',
      fatherName: m.fatherName || '',
      cnicNumber: m.cnicNumber || '',
      committeeName: m.committeeName || '',
      mobileNumber: m.mobileNumber || '',
      address: m.address || (m.district && m.province ? `${m.district}, ${m.province}` : (m.district || m.province || '')),
      province: m.province || '',
      district: m.district || ''
    }));

  // Builds a human-readable description of whatever's currently filtered,
  // e.g. "Punjab Province", "Standing Committee on Education", or "All
  // Senators" if nothing is filtered — used as a prefix for BOTH download
  // buttons, so "Attendance List" becomes "Punjab Province Attendance
  // List" and "List" becomes "Punjab Province List", always reflecting
  // whichever filter is actually active.
  const filterPrefix = (): string => {
    const parts: string[] = [];
    if (provinceFilter !== 'All') parts.push(`${provinceFilter} Province`);
    if (districtFilter !== 'All') parts.push(`${districtFilter} District`);
    if (committeeFilter !== 'All') parts.push(committeeFilter);
    if (parts.length === 0) return `All ${memberLabel}s`;
    return parts.join(' — ');
  };

  const handleExport = async (mode: 'attendance' | 'list', format: ExportFormat) => {
    setExportBusy(true);
    try {
      const prefix = filterPrefix();
      await exportDirectory(format, {
        orgTitle,
        subtitle: `${prefix} ${mode === 'attendance' ? 'ATTENDANCE LIST' : 'LIST'}`.toUpperCase(),
        logoUrl,
        rows: toRows(),
        mode,
        fileNamePrefix: `YSP_${prefix.replace(/[^a-zA-Z0-9]+/g, '_')}_${mode === 'attendance' ? 'Attendance' : 'List'}`
      });
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={`Search by Name, CNIC, Mobile, District...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)} className="px-3 py-2 admin-input text-xs font-bold text-slate-700">
            <option value="All">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className="px-3 py-2 admin-input text-xs font-bold text-slate-700">
            <option value="All">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)} className="px-3 py-2 admin-input text-xs font-bold text-slate-700">
            <option value="All">All Committees</option>
            {committees.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFixMissingData}
            disabled={fixingData}
            title="Fills in CNIC, mobile number, address, and committee for any senator/member missing them, pulled from their original application — safe to run anytime."
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
          >
            {fixingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
            Fix Missing Data
          </button>
          <FormatMenu label="Attendance List" busy={exportBusy} onPick={(f) => handleExport('attendance', f)} />
          <FormatMenu label="List" busy={exportBusy} onPick={(f) => handleExport('list', f)} />
        </div>
      </div>

      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" />
        Showing {filtered.length} of {members.length} {memberLabel.toLowerCase()}(s)
      </p>

      {/* Pure list — no card / certificate / documents actions here on
          purpose. Committee isn't shown as a column (it's a filter only,
          per request) — the field is still exported to PDF/Excel/Word. */}
      <div className="admin-table-wrap">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Father Name</th>
              <th className="p-3">CNIC</th>
              <th className="p-3">Mobile Number</th>
              <th className="p-3">Address</th>
              <th className="p-3">Province</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((m, i) => (
              <tr key={m.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{i + 1}</td>
                <td className="p-3 font-bold text-slate-900">{m.name}</td>
                <td className="p-3 text-slate-600">{m.fatherName || '—'}</td>
                <td className="p-3 font-mono text-slate-700">{m.cnicNumber || '—'}</td>
                <td className="p-3 font-mono text-slate-700">{m.mobileNumber || '—'}</td>
                <td className="p-3 text-slate-600">{m.address || (m.district && m.province ? `${m.district}, ${m.province}` : '—')}</td>
                <td className="p-3 text-slate-600">{m.province || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">No {memberLabel.toLowerCase()}s match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
