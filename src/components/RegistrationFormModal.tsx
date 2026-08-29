import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Senator, MunMember, MembershipApplication } from '../types/ysp';
import { useYSP } from '../context/YSPContext';
import { FileText, Download, Eye, X, Scissors } from 'lucide-react';

interface RegistrationFormModalProps {
  member: Partial<Senator> | Partial<MunMember>;
  application?: MembershipApplication;
  kind: 'senator' | 'mun';
  onClose: () => void;
}

// Digital fill-in of the physical "Registration Form for Youth Senator" /
// MUN registration form paper document. Mirrors every field collected on
// the online application (name, father name, CNIC, DOB, gender, contact,
// email, emergency contact, province/district/city, education,
// institution, profession, preferred committee, address, why-join) plus
// the documents submitted with it, and ends with blank signature lines
// for the candidate and the founder chairman to sign after printing.
// Used from both the Senators and MUN admin "Approved" tables, so both
// stay in sync automatically.
//
// Fields on the physical paper form that we never actually collect
// online — Tehsil, and a separate WhatsApp number distinct from the
// contact number — are left off this digital version rather than shown
// blank, since nothing in our data could ever fill them in. Any field
// the candidate didn't fill in online (e.g. Emergency Contact is
// optional) prints as "—" so it can be filled in by hand.
export const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({ member, application, kind, onClose }) => {
  const { siteSettings } = useYSP();
  const [lightbox, setLightbox] = useState<{ title: string; url: string } | null>(null);

  // Tags <body> for the duration this modal is mounted so the print
  // stylesheet (see index.css) can hide the entire app — header, footer,
  // navbar — and show only the dedicated print pages portalled below.
  useEffect(() => {
    document.body.classList.add('printing-reg-form');
    return () => document.body.classList.remove('printing-reg-form');
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const name = member.name || application?.fullName || '';
  const fatherName = member.fatherName || application?.fatherName || '';
  const cnicNumber = (member as any).cnicNumber || application?.cnicNumber || '';
  const dateOfBirth = formatDate(application?.dateOfBirth);
  const gender = application?.gender || '';
  const district = member.district || application?.district || '';
  const province = member.province || application?.province || '';
  const town = application?.city || '';
  const qualification = application?.education || '';
  const institution = application?.institution || '';
  const profession = application?.profession || '';
  const contactNo = (member as any).phonePrivate || (member as any).phone || application?.phone || '';
  const email = (member as any).email || application?.email || '';
  const emergencyContact = application?.emergencyContact || '';
  const preferredCommittee = (member as any).committeeName || application?.preferredCommittee || '';
  // Kept short on purpose so this block never overflows the printed
  // page — a paper form only has room for a brief motivation line.
  const whyJoinRaw = application?.whyJoin || '';
  const whyJoin = whyJoinRaw.length > 260 ? whyJoinRaw.slice(0, 260).trim() + '…' : whyJoinRaw;
  const address = member.address || application?.address || '';
  const photoUrl = member.photoUrl || application?.photoUrl || application?.passportPhotoUrl || '/images/ysp_official_logo_1786441197850.jpg';
  const membershipId = member.membershipId || '';
  const session = (member.joiningDate || application?.appliedDate || '').slice(0, 4) || new Date().getFullYear().toString();

  const formTitle = kind === 'senator'
    ? 'Registration Form for Youth Senator'
    : 'Youth Senate of Pakistan MUN Registration Form';
  const orgLine1 = 'YOUTH SENATE';
  const orgLine2 = kind === 'senator' ? 'OF PAKISTAN' : 'OF PAKISTAN — YOUTH MUN';

  const docs = [
    { title: 'Applicant Photograph', url: application?.photoUrl || application?.passportPhotoUrl },
    { title: 'CNIC Front Image', url: application?.cnicFrontUrl },
    { title: 'CNIC Back Image', url: application?.cnicBackUrl },
    { title: 'Payment Receipt', url: application?.paymentReceiptUrl }
  ].filter(d => d.url);

  // Printed layout keeps the CNIC front/back together on their own page
  // (see #regFormPrintPortal below); every other submitted document goes
  // on the following page instead.
  const cnicFrontUrl = application?.cnicFrontUrl;
  const cnicBackUrl = application?.cnicBackUrl;
  const otherDocs = [
    { title: 'Applicant Photograph', url: application?.photoUrl || application?.passportPhotoUrl },
    { title: 'Payment Receipt', url: application?.paymentReceiptUrl }
  ].filter(d => d.url);

  const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-baseline gap-2 border-b border-slate-300 pb-1">
      <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{label}:</span>
      <span className="text-[13px] font-semibold text-slate-900 flex-1">{value || '—'}</span>
    </div>
  );

  const TextBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="border-b border-slate-300 pb-1">
      <span className="text-[11px] font-bold text-slate-600">{label}:</span>{' '}
      <span className="text-[13px] font-semibold text-slate-900">{value || '—'}</span>
    </div>
  );

  const SignatureBlock: React.FC = () => (
    <div className="grid grid-cols-2 gap-x-10 pt-8 mt-2">
      <div className="text-center">
        <div className="border-b border-slate-800 h-10" />
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide pt-1">Signature of Candidate</p>
      </div>
      <div className="text-center">
        <div className="border-b border-slate-800 h-10" />
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide pt-1">Signature of Founder Chairman</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-20 z-[100] overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <span>{kind === 'senator' ? 'Senator Registration Form' : 'MUN Registration Form'}</span>
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700">
            ✕
          </button>
        </div>

        {/* The paper-form-style filled document */}
        <div id="registrationFormPrint" className="bg-[#fdfdfb] border-2 border-slate-800 rounded-lg p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="w-16 h-16 shrink-0 rounded-full border-2 border-slate-800 bg-white p-1 overflow-hidden">
              <img
                src={siteSettings.logoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                alt="Youth Senate of Pakistan"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{orgLine1}</h2>
              <p className="text-[11px] font-bold text-slate-600 tracking-[0.3em] uppercase -mt-1">{orgLine2}</p>
              <div className="mt-2 pt-2 border-t-2 border-slate-800">
                <p className="text-sm font-bold uppercase tracking-wide">{formTitle}</p>
                <p className="text-[11px] text-slate-600">Session {session}</p>
              </div>
            </div>
            <div className="w-20 h-24 shrink-0 border-2 border-slate-800 bg-slate-50 flex items-center justify-center overflow-hidden">
              <img src={photoUrl} alt={name} className="w-full h-full object-cover object-[center_15%]" />
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-600">
            Registration No: <span className="font-mono text-slate-900">{membershipId || '—'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Name" value={name} />
            <Field label="Father Name" value={fatherName} />
            <Field label="CNIC No" value={cnicNumber} />
            <Field label="Date of Birth" value={dateOfBirth} />
            <Field label="Gender" value={gender} />
            <Field label="Contact No" value={contactNo} />
            <Field label="Email" value={email} />
            <Field label="Emergency Contact" value={emergencyContact} />
            <Field label="Province" value={province} />
            <Field label="District" value={district} />
            <Field label="Town / City" value={town} />
            <Field label="Qualification" value={qualification} />
            <Field label="Institution" value={institution} />
            <Field label="Profession" value={profession} />
            <Field label="Preferred Committee" value={preferredCommittee} />
          </div>

          <TextBlock label="Address" value={address} />
          <TextBlock label="Why Join" value={whyJoin} />

          <div className="pt-3 border-t-2 border-slate-800 text-center text-[10px] text-slate-500">
            Head Office: {siteSettings.officeAddress} &nbsp;|&nbsp; {siteSettings.officialPhone} &nbsp;|&nbsp; {siteSettings.officialEmail}
          </div>

          <SignatureBlock />
        </div>

        {/* Submitted Documents */}
        {docs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Documents Submitted During Application</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {docs.map((doc, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 group">
                  <p className="text-[11px] font-bold text-slate-700 truncate">{doc.title}</p>
                  <div className="relative aspect-3/2 bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
                    <img src={doc.url} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLightbox({ title: doc.title, url: doc.url! })}
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
                </div>
              ))}
            </div>
          </div>
        )}
        {docs.length === 0 && (
          <p className="text-xs text-slate-400 italic">No original application documents were found for this record.</p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 z-[110] overflow-y-auto">
          <div className="w-full max-w-4xl flex justify-between items-center text-white">
            <h3 className="text-sm font-bold tracking-wider uppercase text-amber-400">{lightbox.title}</h3>
            <button
              onClick={() => setLightbox(null)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-lg flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
          <div className="overflow-hidden flex items-center justify-center my-auto max-h-[75vh]">
            <img src={lightbox.url} alt={lightbox.title} className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border-2 border-white/20" />
          </div>
          <a
            href={lightbox.url}
            download
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res</span>
          </a>
        </div>
      )}
    </div>

    {/* ------------------------------------------------------------------
        Print-only layout — portalled directly onto <body> (see the
        .printing-reg-form rules in index.css) so it prints on its own,
        with none of the site header/footer/navbar or on-screen modal
        chrome around it. Three fixed pages:
          1. The registration form only.
          2. CNIC front, a cut guide, then CNIC back directly below it,
             both sized identically (contain, never cropped) so a ruler
             cut gives two clean, matching pieces.
          3. Every other submitted document, each on its own block with
             generous space around it so nothing overlaps.
        Pages with nothing to show (no CNIC images / no other docs) are
        left out entirely rather than printing blank. ------------------ */}
    {createPortal(
      <div id="regFormPrintPortal" className="hidden print:block bg-white text-slate-900">
        {/* Page 1 — the form itself */}
        <div className="reg-print-page">
          <div className="reg-print-avoid-break border-2 border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-16 h-16 shrink-0 rounded-full border-2 border-slate-800 bg-white p-1 overflow-hidden">
                <img
                  src={siteSettings.logoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                  alt="Youth Senate of Pakistan"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-center">
                <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{orgLine1}</h2>
                <p className="text-[11px] font-bold text-slate-600 tracking-[0.3em] uppercase -mt-1">{orgLine2}</p>
                <div className="mt-2 pt-2 border-t-2 border-slate-800">
                  <p className="text-sm font-bold uppercase tracking-wide">{formTitle}</p>
                  <p className="text-[11px] text-slate-600">Session {session}</p>
                </div>
              </div>
              <div className="w-20 h-24 shrink-0 border-2 border-slate-800 bg-slate-50 flex items-center justify-center overflow-hidden">
                <img src={photoUrl} alt={name} className="w-full h-full object-cover object-[center_15%]" />
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-600">
              Registration No: <span className="font-mono text-slate-900">{membershipId || '—'}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Name" value={name} />
              <Field label="Father Name" value={fatherName} />
              <Field label="CNIC No" value={cnicNumber} />
              <Field label="Date of Birth" value={dateOfBirth} />
              <Field label="Gender" value={gender} />
              <Field label="Contact No" value={contactNo} />
              <Field label="Email" value={email} />
              <Field label="Emergency Contact" value={emergencyContact} />
              <Field label="Province" value={province} />
              <Field label="District" value={district} />
              <Field label="Town / City" value={town} />
              <Field label="Qualification" value={qualification} />
              <Field label="Institution" value={institution} />
              <Field label="Profession" value={profession} />
              <Field label="Preferred Committee" value={preferredCommittee} />
            </div>

            <TextBlock label="Address" value={address} />
            <TextBlock label="Why Join" value={whyJoin} />

            <div className="pt-3 border-t-2 border-slate-800 text-center text-[10px] text-slate-500">
              Head Office: {siteSettings.officeAddress} &nbsp;|&nbsp; {siteSettings.officialPhone} &nbsp;|&nbsp; {siteSettings.officialEmail}
            </div>

            <SignatureBlock />
          </div>
        </div>

        {/* Page 2 — CNIC front and back, stacked and identically sized */}
        {(cnicFrontUrl || cnicBackUrl) && (
          <div className="reg-print-page" style={{ minHeight: '277mm' }}>
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
              CNIC — {name || 'Applicant'}
            </h3>
            <div className="flex flex-col items-center justify-center gap-8">
              {cnicFrontUrl && (
                <div className="reg-print-avoid-break text-center">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">CNIC — Front</p>
                  <div
                    className="border-2 border-slate-800 bg-slate-50 mx-auto overflow-hidden"
                    style={{ width: '130mm', aspectRatio: '1.586' }}
                  >
                    <img src={cnicFrontUrl} alt="CNIC Front" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {cnicFrontUrl && cnicBackUrl && (
                <div className="w-full flex items-center gap-3 text-slate-400" style={{ maxWidth: '130mm' }}>
                  <div className="flex-1 border-t border-dashed border-slate-400" />
                  <Scissors className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Cut here</span>
                  <div className="flex-1 border-t border-dashed border-slate-400" />
                </div>
              )}

              {cnicBackUrl && (
                <div className="reg-print-avoid-break text-center">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">CNIC — Back</p>
                  <div
                    className="border-2 border-slate-800 bg-slate-50 mx-auto overflow-hidden"
                    style={{ width: '130mm', aspectRatio: '1.586' }}
                  >
                    <img src={cnicBackUrl} alt="CNIC Back" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page 3 — every other submitted document, well spaced */}
        {otherDocs.length > 0 && (
          <div className="reg-print-page" style={{ minHeight: '277mm' }}>
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-10">
              Other Submitted Documents — {name || 'Applicant'}
            </h3>
            <div className="flex flex-col items-center gap-12">
              {otherDocs.map((doc, i) => (
                <div key={i} className="reg-print-avoid-break text-center">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">{doc.title}</p>
                  <div
                    className="border-2 border-slate-800 bg-slate-50 mx-auto overflow-hidden flex items-center justify-center"
                    style={{ width: '150mm', height: '95mm' }}
                  >
                    <img src={doc.url} alt={doc.title} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>,
      document.body
    )}
    </>
  );
};
