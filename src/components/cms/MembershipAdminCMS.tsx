import React, { useState, useEffect } from 'react';
import { MembershipApplication, Senator } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
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
  Printer, 
  ShieldCheck, 
  FileText, 
  Award, 
  RefreshCw, 
  CreditCard,
  UserCheck,
  AlertCircle,
  QrCode,
  Calendar,
  Filter
} from 'lucide-react';

export const MembershipAdminCMS: React.FC = () => {
  const { showNotification, currentUser, adminUser } = useYSP();
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [senators, setSenators] = useState<Senator[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'pending' | 'approved' | 'rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

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

  // Generated Card / Certificate Modal
  const [cardModalData, setCardModalData] = useState<{ senator: Partial<Senator>; type: 'card' | 'certificate' } | null>(null);

  const loadData = async () => {
    setLoading(true);
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

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesTab = 
      activeTab === 'pending' ? app.status === 'Submitted' || app.status === 'Pending' || app.status === 'Under Review' :
      activeTab === 'approved' ? app.status === 'Approved' :
      app.status === 'Rejected';

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      app.fullName.toLowerCase().includes(searchLower) ||
      app.cnicNumber.toLowerCase().includes(searchLower) ||
      (app.assignedMembershipId && app.assignedMembershipId.toLowerCase().includes(searchLower)) ||
      app.phone.toLowerCase().includes(searchLower) ||
      app.district.toLowerCase().includes(searchLower) ||
      app.province.toLowerCase().includes(searchLower);

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

  const handleViewSenatorDocs = (senator: Senator) => {
    const app = findAppForSenator(senator);
    if (app) {
      setSelectedApp(app);
    } else {
      showNotification('No original application/document record was found for this senator.', 'error');
    }
  };

  // Filtered Senators (Approved Database)
  const filteredSenators = senators.filter(sen => {
    const searchLower = searchTerm.toLowerCase();
    // Senator records don't store CNIC directly — pull it from the original
    // application (same lookup used for View Docs) so CNIC search works on
    // the Approved Senators table too, not just the Pending queue.
    const senCnic = findAppForSenator(sen)?.cnicNumber || '';
    const matchesSearch = 
      sen.name.toLowerCase().includes(searchLower) ||
      sen.membershipId.toLowerCase().includes(searchLower) ||
      senCnic.toLowerCase().includes(searchLower) ||
      sen.district.toLowerCase().includes(searchLower) ||
      sen.province.toLowerCase().includes(searchLower);

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

    try {
      // 1. Generate unique registration number
      const randomSeq = Math.floor(10000 + Math.random() * 90000);
      const uniqueRegId = `YSP-2026-${randomSeq}`;
      const portalPassword = generatePortalPassword();

      // 2. Update Application Status
      await fetchApi(`/applications/${app.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Approved',
          paymentStatus: 'Verified',
          assignedMembershipId: uniqueRegId,
          reviewNotes: `Approved by Admin (${adminUser?.email || currentUser?.email || 'Admin'}) on ${new Date().toLocaleDateString()}`
        })
      });

      // 3. Create Permanent Senator Record
      const newSenator: Partial<Senator> = {
        membershipId: uniqueRegId,
        name: app.fullName,
        fatherName: app.fatherName,
        designation: 'Youth Senator',
        district: app.district,
        province: app.province,
        photoUrl: app.photoUrl || app.passportPhotoUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg',
        joiningDate: new Date().toISOString().split('T')[0],
        validUntil: '2028-12-31',
        biography: app.whyJoin || 'Inducted Youth Senator',
        parliamentaryRole: app.preferredCommittee ? `Member of ${app.preferredCommittee}` : 'Youth Representative',
        attendancePercentage: 100,
        sessionsAttendedCount: 0,
        eventsAttendedCount: 0,
        certificatesCount: 1,
        status: 'Active',
        email: app.email,
        portalPassword
      };

      await fetchApi('/senators', {
        method: 'POST',
        body: JSON.stringify(newSenator)
      });

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

      // Auto open card modal
      setCardModalData({ senator: newSenator, type: 'card' });

      loadData();
      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (e) {
      showNotification('Failed to approve registration.', 'error');
    }
  };

  // Reject Application Handler
  const handleConfirmReject = async () => {
    if (!rejectingAppId) return;

    try {
      await fetchApi(`/applications/${rejectingAppId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Rejected',
          paymentStatus: 'Rejected',
          reviewNotes: rejectReason || 'Application rejected by administration.'
        })
      });

      showNotification('Application rejected.', 'info');
      setRejectingAppId(null);
      setRejectReason('');
      loadData();
      if (selectedApp?.id === rejectingAppId) setSelectedApp(null);
    } catch (e) {
      showNotification('Failed to reject application.', 'error');
    }
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
        </div>
      </div>

      {/* Filter & Search Controls */}
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

      {/* VIEW 1: APPROVED SENATORS DATABASE */}
      {activeTab === 'approved' ? (
        <div className="admin-table-wrap">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Reg #</th>
                <th className="p-4">Senator Name</th>
                <th className="p-4">District / Province</th>
                <th className="p-4">Parliamentary Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Documents & Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSenators.map(senator => (
                <tr key={senator.id} className="hover:bg-slate-50/80">
                  <td className="p-4 font-mono font-bold text-emerald-800">{senator.membershipId}</td>
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                    <img src={senator.photoUrl} alt={senator.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    <span>{senator.name}</span>
                  </td>
                  <td className="p-4 text-slate-600">{senator.district}, {senator.province}</td>
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
                      onClick={() => setCardModalData({ senator, type: 'card' })}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Card</span>
                    </button>
                    <button
                      onClick={() => setCardModalData({ senator, type: 'certificate' })}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Certificate</span>
                    </button>
                  </td>
                </tr>
              ))}
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
                      <img src={app.photoUrl || app.passportPhotoUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg'} alt={app.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
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

      {/* MODAL 4: DIGITAL MEMBERSHIP CARD & CERTIFICATE DISPLAY */}
      {cardModalData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                {cardModalData.type === 'card' ? <CreditCard className="w-5 h-5 text-emerald-800" /> : <Award className="w-5 h-5 text-amber-600" />}
                <span>{cardModalData.type === 'card' ? 'Official Membership Card' : 'Official Certificate of Inducted Senator'}</span>
              </h3>
              <button onClick={() => setCardModalData(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700">
                ✕
              </button>
            </div>

            {/* RENDER DIGITAL CARD */}
            {cardModalData.type === 'card' && (
              <div id="printableCard" className="w-full max-w-md mx-auto bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl p-6 border-2 border-amber-400 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-amber-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <img src="/src/assets/images/ysp_official_logo_1786441197850.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-amber-400" />
                    <div>
                      <h4 className="text-xs font-black text-amber-300 tracking-tight">YOUTH SENATE OF PAKISTAN</h4>
                      <p className="text-[9px] text-emerald-200 tracking-widest uppercase">Official Membership Card</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase">OFFICIAL</span>
                </div>

                <div className="flex gap-4 items-center">
                  <img
                    src={cardModalData.senator.photoUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg'}
                    alt={cardModalData.senator.name}
                    className="w-20 h-24 object-cover rounded-xl border-2 border-amber-400 shadow-md shrink-0 bg-white"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="text-amber-300 font-extrabold text-sm">{cardModalData.senator.name}</p>
                    <p className="text-emerald-100 font-bold"><span className="text-emerald-400">Reg #:</span> {cardModalData.senator.membershipId}</p>
                    <p className="text-emerald-100"><span className="text-emerald-400">District:</span> {cardModalData.senator.district}</p>
                    <p className="text-emerald-100"><span className="text-emerald-400">Province:</span> {cardModalData.senator.province}</p>
                    <p className="text-emerald-100"><span className="text-emerald-400">Valid Thru:</span> {cardModalData.senator.validUntil || '2028-12-31'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-emerald-800">
                  <div className="text-[9px] text-emerald-300 font-mono">
                    QR Verification Enabled <br />
                    Authorized by Secretariat YSP
                  </div>
                  <div className="w-12 h-12 bg-white p-1 rounded-lg">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                </div>
              </div>
            )}

            {/* RENDER DIGITAL CERTIFICATE */}
            {cardModalData.type === 'certificate' && (
              <div id="printableCertificate" className="w-full bg-slate-50 border-8 border-amber-500/80 p-8 rounded-2xl text-center space-y-4 shadow-xl relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-white p-1 border-2 border-amber-500 shadow-md">
                  <img src="/src/assets/images/ysp_official_logo_1786441197850.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                </div>

                <span className="text-xs font-bold text-amber-700 tracking-widest uppercase block">Youth Senate of Pakistan Secretariat</span>
                <h2 className="text-2xl font-black text-emerald-900 tracking-tight">CERTIFICATE OF MEMBERSHIP</h2>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">This official certificate solemnly affirms that</p>

                <h3 className="text-2xl font-black text-amber-600 underline decoration-amber-400 decoration-2">{cardModalData.senator.name}</h3>

                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                  has been duly inducted as an official Youth Senator representing <span className="font-bold">{cardModalData.senator.district}, {cardModalData.senator.province}</span> with Registration Number <span className="font-mono font-bold text-emerald-800">{cardModalData.senator.membershipId}</span>.
                </p>

                <div className="flex justify-between items-center pt-6 border-t border-slate-300 text-xs">
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500">Issue Date:</p>
                    <p className="font-bold text-slate-800">{cardModalData.senator.joiningDate || new Date().toISOString().split('T')[0]}</p>
                  </div>

                  <div className="w-12 h-12 bg-white p-1 rounded border border-slate-300">
                    <QrCode className="w-full h-full text-slate-800" />
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Authorized Signature:</p>
                    <p className="font-bold text-emerald-900">Founder Chairman / Secretariat</p>
                  </div>
                </div>
              </div>
            )}

            {/* Print & Download Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 admin-btn-primary flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
