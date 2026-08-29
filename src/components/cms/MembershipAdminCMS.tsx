import React, { useState, useEffect } from 'react';
import { MembershipApplication, Senator } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi, getCached } from '../../lib/api';
import { optimisticUpdate } from '../../lib/optimistic';
import { MemberDirectoryTab } from './MemberDirectoryTab';
import { CertificateModal } from '../CertificateModal';
import { RegistrationFormModal } from '../RegistrationFormModal';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ShieldCheck, 
  FileText, 
  Award, 
  RefreshCw, 
  CreditCard,
  UserCheck,
  AlertCircle,
  Calendar,
  Filter,
  Phone,
  Copy,
  CheckCheck
} from 'lucide-react';

export const MembershipAdminCMS: React.FC = () => {
  const { showNotification, currentUser, adminUser, siteSettings } = useYSP();
  // Paint instantly from whatever's cached from a previous fetch this
  // session (e.g. the last time this tab was open), instead of blanking
  // the whole table behind a spinner on every single tab switch. loadData()
  // below still always re-fetches live data in the background afterwards.
  const [applications, setApplications] = useState<MembershipApplication[]>(
    () => (getCached<MembershipApplication[]>('/applications') || []).filter(a => a.applicationType !== 'MUN')
  );
  const [senators, setSenators] = useState<Senator[]>(
    () => getCached<Senator[]>('/senators') || []
  );
  const [loading, setLoading] = useState(
    () => !getCached('/applications') || !getCached('/senators')
  );
  // Drives the small spinning-refresh-button state, separate from the
  // full-page `loading` spinner above, so a manual or background refresh
  // never blanks a table that's already showing data.
  const [refreshing, setRefreshing] = useState(false);

  // Active Tab: 'pending' | 'approved' | 'rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'directory'>('pending');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');

  // Selected Application for Detail & Document Viewer Modal
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  // Document Lightbox state
  const [lightboxImg, setLightboxImg] = useState<{ title: string; url: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection Reason Modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Generated Card / Certificate Modal — always shows the official
  // certificate now (the separate "membership card" view was removed
  // per request; the certificate is the single view everywhere).
  const [cardModalData, setCardModalData] = useState<Partial<Senator> | null>(null);
  // Registration Form modal — same shared component as the MUN admin,
  // pre-filled with the senator's data plus the documents from their
  // original application.
  const [regFormSenator, setRegFormSenator] = useState<Senator | null>(null);
  // Tracks which phone number was just copied, to briefly swap the copy
  // icon for a checkmark as feedback — cleared automatically after 1.5s.
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(prev => (prev === id ? null : prev)), 1500);
    }).catch(() => showNotification('Could not copy — please copy manually.', 'error'));
  };
  const loadData = async (opts: { silent?: boolean } = {}) => {
    // Silent = background/manual refresh of an already-populated table:
    // update the data in place without ever showing the big spinner again.
    if (!opts.silent) setLoading(true);
    try {
      const [apps, sens] = await Promise.all([
        fetchApi<MembershipApplication[]>('/applications'),
        fetchApi<Senator[]>('/senators')
      ]);
      // /api/applications is a shared generic endpoint now carrying both
      // Youth Senate and MUN applications — keep this queue Youth-Senate-only
      // (undefined/legacy applicationType counts as Youth Senate) so MUN
      // applications stay in their own MUN Admin tab (MunAdminCMS.tsx).
      if (apps) setApplications(apps.filter(a => a.applicationType !== 'MUN'));
      if (sens) setSenators(sens);
    } catch (e) {
      console.warn('Failed to load membership data', e);
    } finally {
      setLoading(false);
    }
  };

  // "Refresh" button in the header below — lets the admin pull the latest
  // applications/senators on demand instead of reloading the whole page.
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
  };

  useEffect(() => {
    // If we already painted from cache above, this is just a background
    // refresh; otherwise it's the real first load and the spinner shows.
    const hadCache = !!getCached('/applications') && !!getCached('/senators');
    loadData({ silent: hadCache });

    // Picks up new/changed applications & senators automatically — e.g. a
    // new membership application submitted while this tab is already open —
    // without the admin needing to manually reload the page. Fed by the
    // background revalidation sweep in lib/api.ts (periodic + on
    // reconnect/tab-focus).
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.endpoint === '/applications') {
        setApplications((detail.data as MembershipApplication[]).filter(a => a.applicationType !== 'MUN'));
      } else if (detail.endpoint === '/senators') {
        setSenators(detail.data as Senator[]);
      }
    };
    window.addEventListener('ysp:api-refreshed', onRefresh);
    return () => window.removeEventListener('ysp:api-refreshed', onRefresh);
  }, []);

  // Filtered Applications
  //
  // ROOT CAUSE FIX: every field below used to be accessed as
  // `app.fullName.toLowerCase()` etc. with no guard. Any application
  // record missing so much as one of these fields (a partially-filled
  // legacy record, a record from before a field existed, hand-edited data
  // in the Firestore console, anything not perfectly shaped) threw a
  // TypeError the instant that record's tab was opened. With no error
  // boundary anywhere in the app (now fixed separately, see
  // ErrorBoundary.tsx), that crash didn't just hide one row — it blanked
  // the ENTIRE admin panel to a white screen. This is almost certainly
  // why rejected applications "showed nothing": one malformed rejected
  // record was enough to crash the whole Applications tab the moment it
  // was opened, while Pending/Approved (with no bad record in them)
  // rendered fine. Every field is now read defensively with `|| ''`
  // before calling string methods on it.
  const filteredApps = applications.filter(app => {
    const matchesTab = 
      activeTab === 'pending' ? app.status === 'Submitted' || app.status === 'Pending' || app.status === 'Under Review' :
      activeTab === 'approved' ? app.status === 'Approved' :
      app.status === 'Rejected';

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (app.fullName || '').toLowerCase().includes(searchLower) ||
      (app.cnicNumber || '').toLowerCase().includes(searchLower) ||
      (app.assignedMembershipId || '').toLowerCase().includes(searchLower) ||
      (app.phone || '').toLowerCase().includes(searchLower) ||
      (app.district || '').toLowerCase().includes(searchLower) ||
      (app.province || '').toLowerCase().includes(searchLower);

    const matchesProvince = provinceFilter === 'All' || app.province === provinceFilter;

    return matchesTab && matchesSearch && matchesProvince;
  });

  // Finds the original membership application (with uploaded documents)
  // behind an approved Senator record, so the docs can still be viewed /
  // downloaded once someone has moved from "Applications" into "Senators".
  const findAppForSenator = (senator: Senator): MembershipApplication | undefined => {
    return applications.find(a =>
      (a.assignedMembershipId && a.assignedMembershipId === senator.membershipId) ||
      (a.email && senator.email && a.email.toLowerCase() === senator.email.toLowerCase())
    );
  };

  // Same fallback the Approved table and Directory tab already use: if a
  // senator was inducted before CNIC/phone/address/committee were copied
  // onto their permanent record, fall back to their original application
  // for those fields. Without this, the Card/Certificate view would show
  // dashes for exactly those senators even though the table right next to
  // it correctly shows their real data — which is the bug being fixed
  // here, not a new backfill issue.
  const withAppFallback = (senator: Senator): Senator => {
    const app = findAppForSenator(senator);
    if (!app) return senator;
    return {
      ...senator,
      fatherName: senator.fatherName || app.fatherName,
      cnicNumber: senator.cnicNumber || app.cnicNumber,
      committeeName: senator.committeeName || app.preferredCommittee,
      phonePrivate: senator.phonePrivate || app.phone,
      address: senator.address || app.address
    };
  };

  const handleViewSenatorDocs = (senator: Senator) => {
    const app = findAppForSenator(senator);
    if (app) {
      setSelectedApp(app);
    } else {
      showNotification('No original application/document record was found for this senator.', 'error');
    }
  };

  // Filtered Senators (Approved Database) — same defensive-field fix as above.
  const filteredSenators = senators.filter(sen => {
    const searchLower = searchTerm.toLowerCase();
    // Senator records don't store CNIC directly — pull it from the original
    // application (same lookup used for View Docs) so CNIC search works on
    // the Approved Senators table too, not just the Pending queue.
    const senCnic = findAppForSenator(sen)?.cnicNumber || '';
    const matchesSearch = 
      (sen.name || '').toLowerCase().includes(searchLower) ||
      (sen.membershipId || '').toLowerCase().includes(searchLower) ||
      senCnic.toLowerCase().includes(searchLower) ||
      (sen.district || '').toLowerCase().includes(searchLower) ||
      (sen.province || '').toLowerCase().includes(searchLower);

    const matchesProvince = provinceFilter === 'All' || sen.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  // Generates a readable, sufficiently random login password for new Senators.
  const generatePortalPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };

  // Approve Application Handler
  const handleAcceptRegistration = async (app: MembershipApplication) => {
    if (!window.confirm(`Are you sure you want to approve registration for ${app.fullName}? This will automatically generate their unique YSP Membership ID, Card, and Certificate.`)) {
      return;
    }

    // 1. Generate unique registration number
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const uniqueRegId = `YSP-2026-${randomSeq}`;
    const portalPassword = generatePortalPassword();
    const appPatch = {
      status: 'Approved' as const,
      paymentStatus: 'Verified' as const,
      assignedMembershipId: uniqueRegId,
      reviewNotes: `Approved by Admin (${adminUser?.email || currentUser?.email || 'Admin'}) on ${new Date().toLocaleDateString()}`
    };

    const newSenator: Senator = {
      id: `sen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      membershipId: uniqueRegId,
      name: app.fullName,
      fatherName: app.fatherName,
      cnicNumber: app.cnicNumber,
      designation: 'Youth Senator',
      district: app.district,
      province: app.province,
      committeeName: app.preferredCommittee,
      address: app.address,
      photoUrl: app.photoUrl || app.passportPhotoUrl || '/images/ysp_official_logo_1786441197850.jpg',
      joiningDate: new Date().toISOString().split('T')[0],
      // Fixed expiry date for all Membership Cards & Certificates: 31-03-2027.
      validUntil: '2027-03-31',
      biography: app.whyJoin || 'Inducted Youth Senator',
      parliamentaryRole: app.preferredCommittee ? `Member of ${app.preferredCommittee}` : 'Youth Representative',
      attendancePercentage: 100,
      sessionsAttendedCount: 0,
      eventsAttendedCount: 0,
      certificatesCount: 1,
      status: 'Active',
      email: app.email,
      // The applicant's mobile number carries over onto the permanent
      // Senator record — previously this was left unset, which is why the
      // Approved Senators table showed a dash instead of a real number for
      // every newly-inducted senator, even though the number is right
      // there on the original application.
      phonePrivate: app.phone,
      portalPassword
    } as Senator;

    // Two-write, cross-collection operation (approve the application +
    // induct a permanent senator record). The list UI updates immediately
    // and rolls back exactly if either write fails; the welcome email and
    // card modal only ever fire once both writes are actually confirmed.
    const previousApplications = applications;
    const previousSenators = senators;
    setApplications(prev => prev.map(a => (a.id === app.id ? { ...a, ...appPatch } : a)));
    setSenators(prev => [...prev, newSenator]);

    try {
      await fetchApi(`/applications/${app.id}`, { method: 'PUT', body: JSON.stringify(appPatch) });
      await fetchApi('/senators', { method: 'POST', body: JSON.stringify(newSenator) });

      showNotification(`Registration Approved! Unique ID generated: ${uniqueRegId}`, 'success');

      // 4. Open a prefilled welcome email in the admin's default mail app,
      // addressed to the new senator, with their login credentials.
      const subject = `Welcome to Youth Senate of Pakistan — Your Membership is Approved!`;
      const body =
`Dear ${app.fullName},

Congratulations, and welcome to Youth Senate of Pakistan! We are honored to have you join our national platform for youth civic engagement, parliamentary education, and democratic leadership. Your application has been carefully reviewed and formally approved, and you have been officially inducted as a Youth Senator representing ${app.district}, ${app.province}.

Your unique Youth Senate Membership ID is: ${uniqueRegId}

You can now log in to the Member Portal on our website to view upcoming parliamentary sessions, track your attendance, download your official certificate, and stay connected with fellow Senators from across the country. We encourage you to log in soon and complete your profile.

Your login credentials are below — please keep them confidential and change your habits around sharing them with anyone:

Membership ID / Email: ${uniqueRegId} or ${app.email}
Password: ${portalPassword}

Once again, congratulations on becoming a Youth Senator. We look forward to your active participation and leadership in shaping a stronger, more democratic future for Pakistan's youth.

Warm regards,
Youth Senate of Pakistan`;

      const mailtoLink = `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      // Auto open certificate
      setCardModalData(newSenator);

      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (e) {
      // Roll back both lists exactly — never leave a half-applied
      // approval (e.g. application marked Approved but no senator record).
      setApplications(previousApplications);
      setSenators(previousSenators);
      showNotification('Failed to approve registration.', 'error');
    }
  };

  // Reject Application Handler
  const handleConfirmReject = async () => {
    if (!rejectingAppId) return;
    const patch = {
      status: 'Rejected' as const,
      paymentStatus: 'Rejected' as const,
      reviewNotes: rejectReason || 'Application rejected by administration.'
    };
    const rejectingId = rejectingAppId;
    setRejectingAppId(null);
    setRejectReason('');
    const ok = await optimisticUpdate<MembershipApplication>(
      applications, setApplications, '/applications', rejectingId, patch,
      showNotification,
      { success: 'Application rejected.', failure: 'Failed to reject application.' }
    );
    if (ok && selectedApp?.id === rejectingId) setSelectedApp(null);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Membership Applications Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 admin-glass-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Membership Administration</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Applications & Approved Member Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review CNIC & payment screenshots, approve applications, and auto-generate Membership Cards & Certificates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh data now"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'pending' ? 'bg-emerald-950 text-amber-300 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({applications.filter(a => a.status === 'Submitted' || a.status === 'Pending').length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'approved' ? 'bg-emerald-950 text-amber-300 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved Database ({senators.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'rejected' ? 'bg-emerald-950 text-amber-300 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({applications.filter(a => a.status === 'Rejected').length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'directory' ? 'bg-emerald-950 text-amber-300 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Senators List
          </button>
        </div>
      </div>

      {/* Filter & Search Controls — hidden on the Directory tab, which has
          its own dedicated search/filter bar (province, district,
          committee) and export buttons. */}
      {activeTab !== 'directory' && (
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Name, CNIC, Reg #, Mobile, District..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 admin-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={provinceFilter}
            onChange={e => setProvinceFilter(e.target.value)}
            className="px-3 py-2 admin-input text-xs font-bold text-slate-700"
          >
            <option value="All">All Provinces</option>
            <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
            <option value="Punjab">Punjab</option>
            <option value="Sindh">Sindh</option>
            <option value="Balochistan">Balochistan</option>
            <option value="Islamabad Capital Territory">Islamabad ICT</option>
            <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
            <option value="Azad Jammu & Kashmir">AJK</option>
          </select>
        </div>
      </div>
      )}

      {/* Directory tab: pure filterable list + PDF/Excel/Word export.
          Rendered instead of the pending/approved/rejected tables below. */}
      {activeTab === 'directory' ? (
        <MemberDirectoryTab
          memberLabel="Senator"
          members={senators.map(s => {
            // Senators approved before CNIC/phone/committee were copied onto
            // the permanent Senator record (see handleAcceptRegistration)
            // don't have those fields set directly — same gap the Approved
            // Senators table already works around below. Fall back to the
            // original application here too, so the Directory tab shows the
            // same data the Approved table and each senator's own profile do,
            // instead of blanking out for every senator inducted before that
            // fix landed.
            const app = findAppForSenator(s);
            return {
              id: s.id,
              name: s.name,
              fatherName: s.fatherName || app?.fatherName,
              cnicNumber: s.cnicNumber || app?.cnicNumber,
              committeeName: s.committeeName || app?.preferredCommittee,
              mobileNumber: s.phonePrivate || app?.phone,
              address: s.address || app?.address,
              province: s.province,
              district: s.district
            };
          })}
          onDataFixed={() => loadData({ silent: true })}
        />
      ) : (
      <>
      {/* VIEW 1: APPROVED SENATORS DATABASE */}
      {activeTab === 'approved' ? (
        <div className="admin-table-wrap">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Reg #</th>
                <th className="p-4">Senator Name</th>
                <th className="p-4">District / Province</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Parliamentary Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Documents & Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSenators.map(senator => {
                // Senators approved before the phonePrivate fix (or any
                // record it's still missing on for any reason) fall back to
                // the number on the original application — same lookup the
                // CNIC column and "View Docs" already rely on — so the
                // Mobile column and copy button work for every senator, not
                // just ones inducted after the fix.
                const senatorPhone = senator.phonePrivate || findAppForSenator(senator)?.phone;
                return (
                <tr key={senator.id} className="hover:bg-slate-50/80">
                  <td className="p-4 font-mono font-bold text-emerald-800">{senator.membershipId}</td>
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                    <img src={senator.photoUrl} alt={senator.name} className="w-8 h-8 rounded-full object-cover object-[center_15%] border border-slate-200" />
                    <span>{senator.name}</span>
                  </td>
                  <td className="p-4 text-slate-600">{senator.district}, {senator.province}</td>
                  <td className="p-4">
                    {senatorPhone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-800">{senatorPhone}</span>
                        <button
                          onClick={() => handleCopyPhone(senator.id, senatorPhone)}
                          title="Copy mobile number"
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-emerald-800 shrink-0"
                        >
                          {copiedPhoneId === senator.id ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700">{senator.parliamentaryRole}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {senator.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleViewSenatorDocs(senator)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>View Docs</span>
                    </button>
                    <button
                      onClick={() => setCardModalData(withAppFallback(senator))}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Card</span>
                    </button>
                    <button
                      onClick={() => setCardModalData(withAppFallback(senator))}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Certificate</span>
                    </button>
                    <button
                      onClick={() => setRegFormSenator(senator)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                      <span>Reg. Form</span>
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW 2 & 3: PENDING & REJECTED APPLICATIONS TABLE */
        <div className="admin-table-wrap">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Applicant Name</th>
                <th className="p-4">Father Name</th>
                <th className="p-4">CNIC Number</th>
                <th className="p-4">District / Province</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No membership applications found in this category.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <img src={app.photoUrl || app.passportPhotoUrl || '/images/ysp_official_logo_1786441197850.jpg'} alt={app.fullName} className="w-8 h-8 rounded-full object-cover object-[center_15%] border border-slate-200" />
                      <div>
                        <div>{app.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{app.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{app.fatherName}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{app.cnicNumber}</td>
                    <td className="p-4 text-slate-600">{app.district}, {app.province}</td>
                    <td className="p-4 text-slate-500">{app.appliedDate}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Docs</span>
                      </button>

                      {app.status !== 'Approved' && (
                        <button
                          onClick={() => handleAcceptRegistration(app)}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Accept</span>
                        </button>
                      )}

                      {app.status !== 'Rejected' && (
                        <button
                          onClick={() => setRejectingAppId(app.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {/* MODAL 1: FULL APPLICATION DETAILS & DOCUMENTS VIEWER */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded">
                  Membership Application Dossier
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedApp.fullName}</h3>
                <p className="text-xs text-slate-500">Father Name: {selectedApp.fatherName} | CNIC: {selectedApp.cnicNumber}</p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div><span className="text-slate-400 font-bold block">District:</span> <span className="font-bold text-slate-900">{selectedApp.district}</span></div>
              <div><span className="text-slate-400 font-bold block">Province:</span> <span className="font-bold text-slate-900">{selectedApp.province}</span></div>
              <div><span className="text-slate-400 font-bold block">Mobile Phone:</span> <span className="font-bold text-emerald-800">{selectedApp.phone}</span></div>
              <div><span className="text-slate-400 font-bold block">Email:</span> <span className="font-bold text-slate-900">{selectedApp.email}</span></div>
              <div><span className="text-slate-400 font-bold block">Education:</span> <span className="font-bold text-slate-900">{selectedApp.education}</span></div>
              <div><span className="text-slate-400 font-bold block">Profession:</span> <span className="font-bold text-slate-900">{selectedApp.profession}</span></div>
              <div><span className="text-slate-400 font-bold block">Applied On:</span> <span className="font-bold text-slate-900">{selectedApp.appliedDate}</span></div>
              <div><span className="text-slate-400 font-bold block">Payment Status:</span> <span className="font-bold text-amber-700">{selectedApp.paymentStatus}</span></div>
            </div>

            {/* Sensitive Documents Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Verified Application Documents (Restricted Access)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Applicant Photograph', url: selectedApp.photoUrl || selectedApp.passportPhotoUrl },
                  { title: 'CNIC Front Image', url: selectedApp.cnicFrontUrl },
                  { title: 'CNIC Back Image', url: selectedApp.cnicBackUrl },
                  { title: 'Easypaisa Payment Receipt', url: selectedApp.paymentReceiptUrl }
                ].map((doc, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 group">
                    <p className="text-[11px] font-bold text-slate-700 truncate">{doc.title}</p>
                    <div className="relative aspect-3/2 bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
                      {doc.url ? (
                        <img src={doc.url} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 italic">Doc Uploaded</div>
                      )}
                    </div>
                    {doc.url && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLightboxImg({ title: doc.title, url: doc.url! })}
                          className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-amber-300" />
                          <span>Inspect</span>
                        </button>
                        <a
                          href={doc.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          title={`Download ${doc.title}`}
                          className="shrink-0 p-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded-lg flex items-center justify-center"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              {selectedApp.status !== 'Approved' && (
                <button
                  onClick={() => handleAcceptRegistration(selectedApp)}
                  className="px-5 py-2.5 admin-btn-primary flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>ACCEPT REGISTRATION & GENERATE CARD</span>
                </button>
              )}

              {selectedApp.status !== 'Rejected' && (
                <button
                  onClick={() => setRejectingAppId(selectedApp.id)}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT REGISTRATION</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIGHTBOX INTERACTIVE IMAGE VIEWER */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 z-[100] overflow-y-auto">
          <div className="w-full max-w-4xl flex justify-between items-center text-white">
            <h3 className="text-sm font-bold tracking-wider uppercase text-amber-400">{lightboxImg.title}</h3>
            <button
              onClick={() => {
                setLightboxImg(null);
                setZoomLevel(1);
                setRotation(0);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-lg"
            >
              Close Viewer ✕
            </button>
          </div>

          <div className="overflow-hidden flex items-center justify-center my-auto max-h-[75vh]">
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out'
              }}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border-2 border-white/20"
            />
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700 p-3 rounded-2xl text-white">
            <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))} className="p-2 hover:bg-slate-800 rounded-lg">
              <ZoomIn className="w-5 h-5 text-amber-400" />
            </button>
            <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))} className="p-2 hover:bg-slate-800 rounded-lg">
              <ZoomOut className="w-5 h-5 text-amber-400" />
            </button>
            <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-2 hover:bg-slate-800 rounded-lg">
              <RotateCw className="w-5 h-5 text-amber-400" />
            </button>
            <a
              href={lightboxImg.url}
              download
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res</span>
            </a>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION REASON PROMPT */}
      {rejectingAppId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Specify Rejection Reason</h3>
            <textarea
              rows={3}
              placeholder="e.g., Unclear CNIC photo, invalid payment receipt screenshot..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 admin-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRejectingAppId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button onClick={handleConfirmReject} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL CERTIFICATE (front/back, download PDF) — shared
          component, used identically here and on the public Member
          Portal. Both the "Card" and "Certificate" table buttons open
          this same view (the certificate is the one official document —
          a separate "membership card" look is planned as a future
          redesign of this same modal, not a different screen). */}
      {cardModalData && (
        <CertificateModal
          senator={cardModalData}
          onClose={() => setCardModalData(null)}
        />
      )}

      {/* MODAL: REGISTRATION FORM — filled paper-style form + submitted
          application documents, for the "Reg. Form" table button. */}
      {regFormSenator && (
        <RegistrationFormModal
          member={regFormSenator}
          application={findAppForSenator(regFormSenator)}
          kind="senator"
          onClose={() => setRegFormSenator(null)}
        />
      )}

    </div>
  );
};
