import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Certificate, Senator } from '../types/ysp';
import { CheckCircle2, ShieldAlert, Award, Search, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CertificateModal } from '../components/CertificateModal';

export const CertificateVerifyView: React.FC = () => {
  const { currentViewParam, t } = useYSP();
  const [certNumber, setCertNumber] = useState(currentViewParam || '');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{ found: boolean; certificate?: Certificate; kind?: 'senator'; senator?: Partial<Senator>; message?: string } | null>(null);

  const performVerification = async (numToVerify: string) => {
    if (!numToVerify.trim()) return;
    setSearching(true);
    setResult(null);

    try {
      const res = await fetchApi<{ found: boolean; certificate?: Certificate; kind?: 'senator'; senator?: Partial<Senator>; message?: string }>(
        `/certificates/verify/${encodeURIComponent(numToVerify.trim())}`
      );
      setResult(res);

      if (res.found) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (e: any) {
      setResult({ found: false, message: 'Verification error occurred.' });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (currentViewParam) {
      performVerification(currentViewParam);
    }
  }, [currentViewParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(certNumber);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2 text-center">
        <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-amber-400 mx-auto overflow-hidden shadow-lg">
          <img 
            src="/images/ysp_official_logo_1786441197850.jpg" 
            alt="Youth Senate Emblem" 
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block pt-2">Public Verification Portal</span>
        <h1 className="text-3xl font-extrabold">Official Certificate Verification</h1>
        <p className="text-xs text-emerald-100 max-w-xl mx-auto">
          Verify the authenticity of membership certificates, participation awards, and appointment credentials issued by Youth Senate of Pakistan.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={certNumber}
            onChange={e => setCertNumber(e.target.value)}
            placeholder="Enter Certificate Tracking Number (e.g., YSP-CERT-2025-8801)"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-mono"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded-lg shrink-0"
          >
            {searching ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>

        {result && (
          <div className="pt-4 border-t">
            {result.found && result.kind === 'senator' && result.senator ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border-2 border-emerald-600 rounded-2xl p-6 text-emerald-950 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-700 text-amber-300 font-extrabold text-[10px] rounded uppercase">
                      Certificate Verified
                    </span>
                    <h3 className="text-lg font-bold">{result.senator.name} — {result.senator.membershipId}</h3>
                  </div>
                </div>
                {/* The actual official front/back certificate, embedded
                    inline (not as a popup) — same design and the same
                    working "Download PDF" button used everywhere else in
                    the app, so what's verified here is exactly what the
                    senator holds. */}
                <CertificateModal senator={result.senator} inline />
              </div>
            ) : result.found && result.certificate ? (
              <div className="bg-emerald-50 border-2 border-emerald-600 rounded-2xl p-6 text-emerald-950 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-700 text-amber-300 font-extrabold text-[10px] rounded uppercase">
                        Certificate Verified
                      </span>
                      <h3 className="text-lg font-bold">{result.certificate.certificateNumber}</h3>
                    </div>
                  </div>
                  <img 
                    src="/images/ysp_official_logo_1786441197850.jpg" 
                    alt="Official Seal" 
                    className="w-14 h-14 object-contain rounded-full border border-amber-500 bg-white p-0.5 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-slate-500">Certificate Type:</span>
                    <p className="font-bold text-slate-900">{result.certificate.type}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Recipient Name:</span>
                    <p className="font-bold text-slate-900">{result.certificate.recipientName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Event / Appointment:</span>
                    <p className="font-bold text-slate-900">{result.certificate.eventNameOrRole}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Issue Date:</span>
                    <p className="font-bold text-slate-900">{result.certificate.issueDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Issued Authority:</span>
                    <p className="font-bold text-slate-900">{result.certificate.issuedBy}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <p className="font-bold text-emerald-700">ACTIVE & VALID</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-2xl text-center space-y-2">
                <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="text-base font-bold">Certificate Not Found</h3>
                <p className="text-xs text-red-700">{result.message || 'The certificate number entered does not match any official record in our database.'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
