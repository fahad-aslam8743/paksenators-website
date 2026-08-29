import React, { useState, useEffect, useRef } from 'react';
import { Senator } from '../types/ysp';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import QRCode from 'qrcode';
// html2canvas-pro is a maintained drop-in fork of html2canvas (same API)
// that adds support for modern CSS color functions — oklch(), oklab(),
// color-mix() — which is exactly what Tailwind v4 emits by default for
// every color utility class. Plain html2canvas 1.4.1 throws on any
// element styled with Tailwind v4 classes.
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Award, Download, Loader2, QrCode } from 'lucide-react';

interface CertificateModalProps {
  senator: Partial<Senator>;
  onClose?: () => void;
  // When true, renders just the certificate card (no fixed-position
  // backdrop, no close button) so it can be embedded directly in a page
  // — used by the public Certificate Verification page to show the
  // actual certificate inline once a membership ID is verified, instead
  // of only a summary card.
  inline?: boolean;
}

// Shared front/back official certificate — identical design, data, and
// "Download PDF (Front & Back)" behaviour everywhere it's used (Admin
// Membership CMS and the public Member Portal). Keeping this in one
// component means both places always stay in sync automatically.
export const CertificateModal: React.FC<CertificateModalProps> = ({ senator, onClose, inline = false }) => {
  const { siteSettings } = useYSP();

  const [certSide, setCertSide] = useState<'front' | 'back'>('front');
  const [certQrDataUrl, setCertQrDataUrl] = useState<string>('');
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [founderName, setFounderName] = useState('Irfan Mateen');

  // The certificate is built once at a fixed, high-resolution native size
  // (CERT_W x CERT_H) so text/photo layout never wraps, squishes, or
  // overflows differently on different screens. It's then visually
  // shrunk to fit whatever width is available using a CSS
  // transform: scale(), computed from the container's real width via
  // ResizeObserver. This keeps the design pixel-identical at every screen
  // size; only its on-screen size changes, never its layout.
  const CERT_W = 750;
  const CERT_H = 540;
  const certWrapRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  useEffect(() => {
    if (!certWrapRef.current) return;
    const el = certWrapRef.current;
    const update = () => setCertScale(Math.min(1, el.clientWidth / CERT_W));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Founder Chairman name for the signature block on the front side.
  useEffect(() => {
    fetchApi<any[]>('/leadership')
      .then(leadership => {
        const founder = (leadership || []).find((l: any) => l.category === 'Founder Chairman');
        if (founder?.name) setFounderName(founder.name);
      })
      .catch(() => {});
  }, []);

  // Verification QR — encodes a direct link to the public verification
  // page for this member's certificate.
  useEffect(() => {
    if (senator.membershipId) {
      const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(senator.membershipId)}`;
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 300, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(setCertQrDataUrl)
        .catch(() => setCertQrDataUrl(''));
    }
  }, [senator.membershipId]);

  // Waits for every <img> inside an element to finish loading (or fail)
  // before returning. html2canvas can silently capture a blank/broken box
  // if it runs before a cross-origin (Cloudinary-hosted) photo has
  // finished loading.
  const waitForImages = (el: HTMLElement): Promise<void> => {
    const imgs = Array.from(el.querySelectorAll('img'));
    return Promise.all(
      imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      })
    ).then(() => undefined);
  };

  // Downloads the certificate as a single two-page PDF (front + back), in
  // one click.
  const handleDownloadCertificatePdf = async () => {
    const frontEl = document.getElementById('certificateFront');
    const backEl = document.getElementById('certificateBack');
    if (!frontEl || !backEl) return;

    setDownloadingCert(true);
    const originalFrontTransform = frontEl.style.transform;
    const originalBackTransform = backEl.style.transform;
    frontEl.style.transform = 'none';
    backEl.style.transform = 'none';

    try {
      await new Promise(requestAnimationFrame); // let the browser reflow at native size first
      await Promise.all([waitForImages(frontEl), waitForImages(backEl)]);

      const captureOpts = { scale: 3, useCORS: true, backgroundColor: '#ffffff', width: CERT_W, height: CERT_H } as const;
      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontEl, captureOpts),
        html2canvas(backEl, captureOpts)
      ]);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [CERT_W, CERT_H] });
      pdf.addImage(frontCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, CERT_W, CERT_H);
      pdf.addPage([CERT_W, CERT_H], 'landscape');
      pdf.addImage(backCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, CERT_W, CERT_H);

      const namePart = (senator.name || 'certificate').replace(/[^a-zA-Z0-9]+/g, '_');
      pdf.save(`YSP_Certificate_${namePart}.pdf`);
    } catch (e: any) {
      // Best-effort — a toast isn't critical here, the button state
      // returning to normal is enough feedback for a failed export.
      console.warn('Certificate PDF export failed', e);
    } finally {
      frontEl.style.transform = originalFrontTransform;
      backEl.style.transform = originalBackTransform;
      setDownloadingCert(false);
    }
  };

  return (
    <div className={inline ? 'w-full' : 'fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto'}>
      <div className={inline ? 'bg-white rounded-3xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6' : 'bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto'}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Official Certificate of Inducted Senator</span>
          </h3>
          {!inline && (
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700">
              ✕
            </button>
          )}
        </div>

        {/* RENDER DIGITAL CERTIFICATE — front/back official Youth Senator
            certificate. Built at a fixed native resolution (CERT_W x
            CERT_H) and scaled to fit via CSS transform (see certScale
            above) — this is what makes it render identically on any
            screen size instead of squishing/wrapping on mobile. */}
        <div className="space-y-4">
          {/* Front / Back tabs */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setCertSide('front')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${certSide === 'front' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Front
            </button>
            <button
              onClick={() => setCertSide('back')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${certSide === 'back' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Back
            </button>
          </div>

          {/* Responsive scaling wrapper — both sides are always stacked
              at the exact same normal position (top:0, left:0), never
              pushed far off-screen, so html2canvas reliably captures
              them; only z-index decides which one is visually on top. */}
          <div ref={certWrapRef} className="relative w-full mx-auto overflow-hidden" style={{ maxWidth: CERT_W, height: CERT_H * certScale }}>
            {/* FRONT SIDE */}
            <div
              id="certificateFront"
              style={{
                width: CERT_W, height: CERT_H,
                transform: `scale(${certScale})`, transformOrigin: 'top left',
                position: 'absolute', top: 0, left: 0,
                zIndex: certSide === 'front' ? 1 : 0
              }}
              className="bg-[#fbf9f2] rounded-xl border-[3px] border-[#c9a227] shadow-xl overflow-hidden"
            >
              <svg viewBox={`0 0 ${CERT_W} ${CERT_H}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path d={`M0,0 L260,0 C170,${CERT_H * 0.18} 120,${CERT_H * 0.42} 0,${CERT_H * 0.5} Z`} fill="#0d3b2b" />
                <path d={`M260,0 L272,0 C182,${CERT_H * 0.18} 132,${CERT_H * 0.42} 12,${CERT_H * 0.5} L0,${CERT_H * 0.5}`} fill="none" stroke="#e8c766" strokeWidth="4" />
                <path d={`M0,${CERT_H * 0.86} C${CERT_W * 0.35},${CERT_H * 0.94} ${CERT_W * 0.65},${CERT_H * 0.78} ${CERT_W},${CERT_H * 0.88} L${CERT_W},${CERT_H} L0,${CERT_H} Z`} fill="#0d3b2b" />
                <path d={`M0,${CERT_H * 0.855} C${CERT_W * 0.35},${CERT_H * 0.935} ${CERT_W * 0.65},${CERT_H * 0.775} ${CERT_W},${CERT_H * 0.875}`} fill="none" stroke="#e8c766" strokeWidth="4" />
              </svg>

              <div className="relative h-full flex flex-col px-8 pt-6 pb-4">
                <div className="flex items-start justify-center relative">
                  <div className="absolute left-0 top-0 w-[100px] h-[100px] rounded-full bg-white border-[3px] border-[#c9a227] p-2 shadow-md">
                    <img src="/images/ysp_emblem_mark.png" alt="Youth Senate of Pakistan" className="w-full h-full object-contain" />
                  </div>

                  <div className="text-center pt-1">
                    <p className="text-[#c9a227] text-xl leading-none mb-0.5">☾ ★</p>
                    <h2 className="text-[34px] font-black text-[#0d3b2b] tracking-tight leading-none" style={{ fontFamily: 'Georgia, serif' }}>YOUTH SENATE</h2>
                    <div className="flex items-center gap-2 justify-center mt-1">
                      <span className="w-10 h-px bg-[#c9a227]" />
                      <p className="text-[13px] font-bold text-[#c9a227] tracking-[0.35em] uppercase">of Pakistan</p>
                      <span className="w-10 h-px bg-[#c9a227]" />
                    </div>
                  </div>

                  <div className="absolute right-0 top-1 w-16 h-16 rounded-full border-2 border-[#0d3b2b]/30 bg-white p-1.5 flex items-center justify-center overflow-hidden">
                    <img src="/images/ysp_state_emblem.png" alt="State Emblem of Pakistan" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="flex justify-center mt-3">
                  <span className="px-6 py-1.5 bg-[#0d3b2b] text-[#f5d98a] text-[13px] font-black uppercase tracking-widest rounded-full shadow-sm">
                    ★ {senator.designation || senator.parliamentaryRole || 'Youth Senator'} ★
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-start gap-6">
                    <div className="shrink-0">
                      <div className="w-[130px] h-[155px] rounded-lg border-[3px] border-[#c9a227] overflow-hidden bg-white shadow-md">
                        <img
                          src={senator.photoUrl || '/images/ysp_official_logo_1786441197850.jpg'}
                          alt={senator.name}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/ysp_official_logo_1786441197850.jpg';
                          }}
                          className="w-full h-full object-cover object-[center_15%]"
                        />
                      </div>
                      <div className="w-[64px] h-[64px] bg-white p-1 rounded shadow border border-slate-200 mt-4 mx-auto">
                        {certQrDataUrl ? (
                          <img src={certQrDataUrl} alt="QR" className="w-full h-full" />
                        ) : (
                          <QrCode className="w-full h-full text-slate-800" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-[15px]">
                      <div className="grid grid-cols-[150px,1fr] gap-y-2">
                        <span className="font-bold text-slate-800">NAME:</span>
                        <span className="font-black text-slate-900 uppercase">{senator.name}</span>
                        <div className="col-span-2 border-b border-slate-300" />
                        <span className="font-bold text-slate-800">FATHER NAME:</span>
                        <span className="font-black text-slate-900 uppercase">{senator.fatherName || '—'}</span>
                        <div className="col-span-2 border-b border-slate-300" />
                        <span className="font-bold text-[#8a1f2b]">DESIGNATION:</span>
                        <span className="font-black text-[#8a1f2b] uppercase">{senator.designation || senator.parliamentaryRole || 'Youth Senator'}</span>
                        <div className="col-span-2 border-b border-slate-300" />
                        <span className="font-bold text-slate-800">MEMBERSHIP ID:</span>
                        <span className="font-black text-slate-900">{senator.membershipId}</span>
                        <div className="col-span-2 border-b border-slate-300" />
                        <span className="font-bold text-slate-800">CNIC / FORM B:</span>
                        <span className="font-black text-slate-900">{senator.cnicNumber || '—'}</span>
                        <div className="col-span-2 border-b border-slate-300" />
                        <span className="font-bold text-[#8a1f2b]">VALID UPTO:</span>
                        <span className="font-black text-[#8a1f2b]">31-03-2027</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute right-8" style={{ bottom: '104px' }}>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-wide mb-1">Issuing Authority</p>
                  <img
                    src="/images/ysp_issuing_stamp.png"
                    alt="Issuing Authority Stamp & Signature"
                    className="w-[64px] h-[64px] object-contain ml-auto"
                  />
                  <p className="text-[12px] italic text-slate-700 leading-tight -mt-1" style={{ fontFamily: 'Georgia, serif' }}>{founderName}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase leading-tight">Founder Chairman<br />Youth Senate of Pakistan</p>
                </div>
              </div>

              <p className="absolute bottom-2 left-8 text-[12px] text-[#f5d98a] font-semibold" dir="rtl">با اختیار نوجوان، مضبوط پاکستان</p>
            </div>

            {/* BACK SIDE */}
            <div
              id="certificateBack"
              style={{
                width: CERT_W, height: CERT_H,
                transform: `scale(${certScale})`, transformOrigin: 'top left',
                position: 'absolute', top: 0, left: 0,
                zIndex: certSide === 'back' ? 1 : 0
              }}
              className="bg-[#fbf9f2] rounded-xl border-[3px] border-[#c9a227] shadow-xl overflow-hidden"
            >
              <svg viewBox={`0 0 ${CERT_W} ${CERT_H}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path d={`M0,0 L150,0 C90,${CERT_H * 0.12} 60,${CERT_H * 0.25} 0,${CERT_H * 0.3} Z`} fill="#0d3b2b" />
                <path d={`M0,${CERT_H * 0.88} C${CERT_W * 0.35},${CERT_H * 0.95} ${CERT_W * 0.65},${CERT_H * 0.8} ${CERT_W},${CERT_H * 0.89} L${CERT_W},${CERT_H} L0,${CERT_H} Z`} fill="#0d3b2b" />
                <path d={`M0,${CERT_H * 0.875} C${CERT_W * 0.35},${CERT_H * 0.945} ${CERT_W * 0.65},${CERT_H * 0.795} ${CERT_W},${CERT_H * 0.885}`} fill="none" stroke="#e8c766" strokeWidth="4" />
              </svg>

              <div className="relative h-full flex flex-col items-center px-10 pt-5 pb-4">
                <div className="w-[104px] h-[104px] shrink-0 rounded-full bg-white border-[3px] border-[#c9a227] p-2 mb-1.5 shadow-md overflow-hidden">
                  <img src="/images/ysp_state_emblem.png" alt="State Emblem of Pakistan" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-[20px] font-black text-[#0d3b2b] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>YOUTH SENATE OF PAKISTAN</h3>

                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 mt-3.5 text-[14px]">
                  <div>
                    <p className="font-bold text-[#8a1f2b] uppercase">Address:</p>
                    <p className="text-slate-800 leading-snug">{senator.address || (senator.district && senator.province ? `${senator.district}, ${senator.province}` : (senator.district || senator.province || '—'))}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#8a1f2b] uppercase">Contact No:</p>
                    <p className="text-slate-800">{senator.phonePrivate || '—'}</p>
                  </div>

                  <div className="col-span-2 border-b border-slate-300" />

                  <div>
                    <p className="font-bold text-[#8a1f2b] uppercase">Email:</p>
                    <p className="text-slate-800">{siteSettings.officialEmail}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#8a1f2b] uppercase">Helpline:</p>
                    <p className="text-slate-800">{(siteSettings.officialPhone || '').split(',')[1]?.trim() || (siteSettings.officialPhone || '').split(',')[0]?.trim()}</p>
                  </div>

                  <div className="col-span-2 border-b border-slate-300" />

                  <div>
                    <p className="font-bold text-[#8a1f2b] uppercase">Website:</p>
                    <p className="text-slate-800">youthsenateofpakistan.org</p>
                  </div>
                </div>
              </div>

              <div className="absolute left-0 right-0 flex flex-col items-center" style={{ bottom: '134px' }}>
                <div className="w-[60px] h-[60px] bg-white p-1 rounded shadow border border-slate-200">
                  {certQrDataUrl ? (
                    <img src={certQrDataUrl} alt="QR" className="w-full h-full" />
                  ) : (
                    <QrCode className="w-full h-full text-slate-800" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-600 uppercase mt-1.5">Scan for Verification</p>
              </div>

              <div className="absolute left-0 right-0 bottom-3 flex items-center justify-center gap-2">
                <p className="text-[11px] text-[#f5d98a] font-semibold" dir="rtl">با اختیار نوجوان، مضبوط پاکستان</p>
                <span className="text-[11px] text-[#f5d98a]">•</span>
                <p className="text-[11px] text-[#f5d98a] italic">Empowered Youth, Strong Pakistan.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleDownloadCertificatePdf}
            disabled={downloadingCert}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded-lg flex items-center gap-2 disabled:opacity-60"
          >
            {downloadingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-300" />}
            <span>{downloadingCert ? 'Generating PDF...' : 'Download PDF (Front & Back)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
