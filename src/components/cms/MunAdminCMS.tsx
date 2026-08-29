import React, { useState, useEffect } from 'react';
import { MembershipApplication, MunMember } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi, getCached } from '../../lib/api';
import { optimisticUpdate } from '../../lib/optimistic';
import { MemberDirectoryTab } from './MemberDirectoryTab';
import { RegistrationFormModal } from '../RegistrationFormModal';
import {
  Globe2,
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
  RefreshCw,
  UserCheck,
  Calendar,
  Filter,
  Phone,
  Copy,
  CheckCheck
} from 'lucide-react';

export const MunAdminCMS: React.FC = () => {
  const { showNotification, currentUser, adminUser } = useYSP();
  // Paint instantly from whatever's cached from a previous fetch this
  // session (e.g. the last time this tab was open), instead of blanking
  // the whole table behind a spinner on every single tab switch. loadData()
  // below still always re-fetches live data in the background afterwards.
  const [applications, setApplications] = useState<MembershipApplication[]>(
    () => (getCached<MembershipApplication[]>('/applications') || []).filter(a => a.applicationType === 'MUN')
  );
  const [munMembers, setMunMembers] = useState<MunMember[]>(
    () => getCached<MunMember[]>('/mun-members') || []
  );
  const [loading, setLoading] = useState(
    () => !getCached('/applications') || !getCached('/mun-members')
  );
  // Drives the small spinning-refresh-button state, separate from the
  // full-page `loading` spinner above, so a manual or background refresh
  // never blanks a table that's already showing data.
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'directory'>('pending');

  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');

  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  const [lightboxImg, setLightboxImg] = useState<{ title: string; url: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Tracks which mobile number was just copied, to briefly swap the copy
  // icon for a checkmark as feedback — cleared automatically after 1.5s.
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  // Registration Form modal — shared component with the Senators admin,
  // pre-filled with the member's data plus their application documents.
  const [regFormMember, setRegFormMember] = useState<MunMember | null>(null);
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
      const [apps, members] = await Promise.all([
        fetchApi<MembershipApplication[]>('/applications'),
        fetchApi<MunMember[]>('/mun-members')
      ]);
      if (apps) setApplications(apps.filter(a => a.applicationType === 'MUN'));
      if (members) setMunMembers(members);
    } catch (e) {
      console.warn('Failed to load Youth MUN data', e);
    } finally {
      setLoading(false);
    }
  };

  // "Refresh" button in the header below — lets the admin pull the latest
  // applications/members on demand instead of reloading the whole page.
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
  };

  useEffect(() => {
    // If we already painted from cache above, this is just a background
    // refresh; otherwise it's the real first load and the spinner shows.
    const hadCache = !!getCached('/applications') && !!getCached('/mun-members');
    loadData({ silent: hadCache });

    // Picks up new/changed applications & members automatically — e.g. a
    // new Youth MUN application submitted while this tab is already open —
    // without the admin needing to manually reload the page. Fed by the
    // background revalidation sweep in lib/api.ts (periodic + on
    // reconnect/tab-focus).
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.endpoint === '/applications') {
        setApplications((detail.data as MembershipApplication[]).filter(a => a.applicationType === 'MUN'));
      } else if (detail.endpoint === '/mun-members') {
        setMunMembers(detail.data as MunMember[]);
      }
    };
    window.addEventListener('ysp:api-refreshed', onRefresh);
    return () => window.removeEventListener('ysp:api-refreshed', onRefresh);
  }, []);

  const filteredApps = applications.filter(app => {
    const matchesTab =
      activeTab === 'pending' ? app.status === 'Submitted' || app.status === 'Pending' || app.status === 'Under Review' :
      activeTab === 'approved' ? app.status === 'Approved' :
      app.status === 'Rejected';

    const searchLower = searchTerm.toLowerCase();
    // See MembershipAdminCMS.tsx for why every field here is guarded with
    // `|| ''` — an unguarded access on one malformed record used to crash
    // this whole tab (and, with no error boundary in the app previously,
    // the entire admin panel) rather than just skipping that record.
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
  // behind an approved MunMember record, so docs stay viewable/downloadable
  // after approval — same pattern as findAppForSenator in MembershipAdminCMS.
  const findAppForMunMember = (member: MunMember): MembershipApplication | undefined => {
    return applications.find(a =>
      (a.assignedMembershipId && a.assignedMembershipId === member.membershipId) ||
      (a.email && member.email && a.email.toLowerCase() === member.email.toLowerCase())
    );
  };

  const handleViewMemberDocs = (member: MunMember) => {
    const app = findAppForMunMember(member);
    if (app) {
      setSelectedApp(app);
    } else {
      showNotification('No original application/document record was found for this member.', 'error');
    }
  };

  const filteredMembers = munMembers.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    // MunMember records don't store CNIC directly — pull it from the
    // original application (same lookup used for View Docs) so CNIC search
    // works on the Approved MUN Members table too, not just the Pending queue.
    const memberCnic = findAppForMunMember(m)?.cnicNumber || '';
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchLower) ||
      (m.membershipId || '').toLowerCase().includes(searchLower) ||
      memberCnic.toLowerCase().includes(searchLower) ||
      (m.district || '').toLowerCase().includes(searchLower) ||
      (m.province || '').toLowerCase().includes(searchLower);

    const matchesProvince = provinceFilter === 'All' || m.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  // Approve Application Handler — Youth MUN's process is Application ->
  // Shortlisting -> Interview -> Final Selection, so acceptance here means
  // "shortlisted for interview", not "fully inducted" like Youth Senate.
  const handleAcceptRegistration = async (app: MembershipApplication) => {
    if (!window.confirm(`Are you sure you want to shortlist ${app.fullName} for a Youth MUN interview? This will generate their MUN reference ID and open a prefilled interview invitation email.`)) {
      return;
    }

    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const uniqueRegId = `MUN-${new Date().getFullYear()}-${randomSeq}`;
    const appPatch = {
      status: 'Approved' as const,
      paymentStatus: 'Verified' as const,
      assignedMembershipId: uniqueRegId,
      reviewNotes: `Shortlisted by Admin (${adminUser?.email || currentUser?.email || 'Admin'}) on ${new Date().toLocaleDateString()}`
    };
    const newMember: MunMember = {
      id: `mun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      membershipId: uniqueRegId,
      name: app.fullName,
      fatherName: app.fatherName,
      cnicNumber: app.cnicNumber,
      district: app.district,
      province: app.province,
      committeeName: app.preferredCommittee,
      address: app.address,
      photoUrl: app.photoUrl || app.passportPhotoUrl || '/images/ysp_official_logo_1786441197850.jpg',
      email: app.email,
      phone: app.phone,
      joiningDate: new Date().toISOString().split('T')[0],
      validUntil: `${new Date().getFullYear() + 1}-12-31`,
      biography: app.whyJoin || 'Youth MUN Member',
      role: 'Youth MUN Member',
      status: 'Active'
    } as MunMember;

    // This is a two-write, cross-collection operation (approve the
    // application + create the MUN member record) with a real-world side
    // effect afterward (opening an email draft) — that side effect must
    // only ever fire once both writes are actually confirmed, so this
    // isn't blindly "fire the email and hope". The list UI still updates
    // immediately and rolls back exactly if either write fails, so the
    // admin isn't left staring at a spinner for a two-step operation.
    const previousApplications = applications;
    const previousMembers = munMembers;
    setApplications(prev => prev.map(a => (a.id === app.id ? { ...a, ...appPatch } : a)));
    setMunMembers(prev => [...prev, newMember]);

    try {
      await fetchApi(`/applications/${app.id}`, { method: 'PUT', body: JSON.stringify(appPatch) });
      await fetchApi('/mun-members', { method: 'POST', body: JSON.stringify(newMember) });

      showNotification(`Application shortlisted! MUN Reference ID generated: ${uniqueRegId}`, 'success');

      // Warm, professional interview-invitation email — not a "you're fully
      // inducted" welcome message, since MUN's real process still requires
      // an interview before final membership.
      const subject = `Youth Senate of Pakistan — Youth MUN Application Shortlisted for Interview`;
      const body =
`Dear ${app.fullName},

Congratulations! We are pleased to inform you that your application for Youth MUN Membership with Youth Senate of Pakistan has been carefully reviewed, and you have been shortlisted to proceed to the interview stage.

Your Youth MUN Reference ID is: ${uniqueRegId}

This is an important step in our selection process — Application Review, Shortlisting, Interview, and Final Selection — and we were impressed by your profile and motivation to join our Model United Nations community as a delegate representing ${app.district}, ${app.province}.

Our team will be in touch shortly to schedule your interview. Please keep your Reference ID handy and be ready to discuss your interest in international relations, diplomacy, and public speaking, as well as your motivation for joining Youth MUN.

We look forward to speaking with you and wish you the very best for your interview.

Warm regards,
Youth MUN Secretariat
Youth Senate of Pakistan`;

      const mailtoLink = `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (e) {
      // Roll back both lists exactly — never leave a half-applied
      // approval (e.g. application marked Approved but no member record).
      setApplications(previousApplications);
      setMunMembers(previousMembers);
      showNotification('Failed to shortlist application.', 'error');
    }
  };

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
        <p className="mt-2 text-xs font-bold">Loading Youth MUN Applications Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 admin-glass-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Globe2 className="w-4 h-4 text-emerald-600" />
            <span>Youth MUN Administration</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">MUN Applications & Member Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review CNIC & payment screenshots, shortlist applicants for interview, and manage the Youth MUN member directory.
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
            Approved (MUN Members) ({munMembers.length})
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
            Members List
          </button>
        </div>
      </div>

      {/* Filter & Search Controls — hidden on the Directory tab, which has
          its own dedicated search/filter bar and export buttons. */}
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

      {/* Directory tab: pure filterable list + PDF/Excel/Word export. */}
      {activeTab === 'directory' ? (
        <MemberDirectoryTab
          memberLabel="MUN Member"
          members={munMembers.map(m => {
            // Same gap as the Senator directory: members approved before
            // CNIC/phone/committee were copied onto the permanent record
            // don't have those fields set directly. Fall back to the
            // original application, same as the Approved table below.
            const app = findAppForMunMember(m);
            return {
              id: m.id,
              name: m.name,
              fatherName: m.fatherName || app?.fatherName,
              cnicNumber: m.cnicNumber || app?.cnicNumber,
              committeeName: m.committeeName || app?.preferredCommittee,
              mobileNumber: m.phone || app?.phone,
              address: m.address || app?.address,
              province: m.province,
              district: m.district
            };
          })}
          onDataFixed={() => loadData({ silent: true })}
        />
      ) : (
      <>
      {/* VIEW 1: APPROVED MUN MEMBERS DIRECTORY */}
      {activeTab === 'approved' ? (
        <div className="admin-table-wrap">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Reg #</th>
                <th className="p-4">Member Name</th>
                <th className="p-4">District / Province</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No Youth MUN members found in this category.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono font-bold text-emerald-800">{member.membershipId}</td>
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <img src={member.photoUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover object-[center_15%] border border-slate-200" />
                      <span>{member.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">{member.district}, {member.province}</td>
                    <td className="p-4">
                      {member.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-800">{member.phone}</span>
                          <button
                            onClick={() => handleCopyPhone(member.id, member.phone!)}
                            title="Copy mobile number"
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-emerald-800 shrink-0"
                          >
                            {copiedPhoneId === member.id ? (
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
                    <td className="p-4 text-slate-700">{member.role}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewMemberDocs(member)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Docs</span>
                      </button>
                      <button
                        onClick={() => setRegFormMember(member)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span>Reg. Form</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
                    No Youth MUN applications found in this category.
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
                  Youth MUN Application Dossier
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
                  { title: 'Payment Receipt', url: selectedApp.paymentReceiptUrl }
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
                  <span>ACCEPT & INVITE FOR INTERVIEW</span>
                </button>
              )}

              {selectedApp.status !== 'Rejected' && (
                <button
                  onClick={() => setRejectingAppId(selectedApp.id)}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT APPLICATION</span>
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

      {/* MODAL: REGISTRATION FORM — filled paper-style form + submitted
          application documents, for the "Reg. Form" table button. Shared
          component with the Senators admin. */}
      {regFormMember && (
        <RegistrationFormModal
          member={regFormMember}
          application={findAppForMunMember(regFormMember)}
          kind="mun"
          onClose={() => setRegFormMember(null)}
        />
      )}
    </div>
  );
};
