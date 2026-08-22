import React, { useState } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { CheckCircle2, ShieldCheck, Upload, AlertCircle, Copy, FileText, Image as ImageIcon, CreditCard, DollarSign, Loader2 } from 'lucide-react';

export const MembershipApplyView: React.FC = () => {
  const { siteSettings, t, showNotification, navigate } = useYSP();

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    dateOfBirth: '',
    gender: 'Male',
    cnicNumber: '',
    province: 'Punjab',
    district: '',
    city: '',
    education: '',
    institution: '',
    profession: '',
    phone: '',
    email: '',
    address: '',
    photoUrl: '',
    passportPhotoUrl: '',
    cnicFrontUrl: '',
    cnicBackUrl: '',
    paymentReceiptUrl: '',
    whyJoin: '',
    skills: '',
    preferredCommittee: 'Standing Committee on Education & Youth Skill Development',
    emergencyContact: '',
    termsAccepted: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'passportPhotoUrl' | 'cnicFrontUrl' | 'cnicBackUrl' | 'paymentReceiptUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showNotification('File size is too large. Please select an image under 8MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const resultStr = reader.result;
        setFormData(prev => {
          const updated = { ...prev, [field]: resultStr };
          if (field === 'passportPhotoUrl') {
            updated.photoUrl = resultStr;
          }
          return updated;
        });
        showNotification('File uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      showNotification('Please accept the declaration terms before submitting.', 'error');
      return;
    }

    if (!formData.passportPhotoUrl && !formData.photoUrl) {
      showNotification('Please upload your Passport Size Picture.', 'error');
      return;
    }

    if (!formData.cnicFrontUrl) {
      showNotification('Please upload your CNIC Front Side image.', 'error');
      return;
    }

    if (!formData.cnicBackUrl) {
      showNotification('Please upload your CNIC Back Side image.', 'error');
      return;
    }

    if (!formData.paymentReceiptUrl) {
      showNotification('Please upload the Registration Fee (PKR 3,000) payment screenshot.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi<{ success: boolean; application: { id: string } }>('/applications', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          applicationType: 'Youth Senate',
          areasOfInterest: [formData.preferredCommittee]
        })
      });

      setSubmittedAppId(res.application.id);
      showNotification('Membership Application submitted successfully!');
    } catch (e: any) {
      showNotification(e.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedAppId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white p-8 rounded-2xl border-2 border-emerald-800 shadow-xl space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-700 mx-auto" />
          <h1 className="text-2xl font-extrabold text-slate-900">Application Submitted Successfully!</h1>
          <p className="text-xs text-slate-600">
            Your application reference code is:
          </p>
          <div className="text-2xl font-black text-amber-600 bg-amber-50 py-3 px-6 rounded-lg border border-amber-300 inline-block">
            {submittedAppId}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your application and uploaded credentials (CNIC, Passport Photo & EasyPaisa Payment Screenshot) have been received by the Youth Senate Secretariat. You will be notified via email regarding scrutiny and membership approval.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => navigate('home')}
              className="px-6 py-2 bg-emerald-800 text-white font-bold text-xs uppercase rounded"
            >
              Return Home
            </button>
            <button
              onClick={() => navigate('portal')}
              className="px-6 py-2 border border-amber-500 text-amber-700 font-bold text-xs uppercase rounded"
            >
              Senator Login Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Official Online Induction</span>
        <h1 className="text-3xl font-extrabold">Online Membership Application</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Complete the official form to apply for Youth Senate of Pakistan membership. Upload your passport photo, CNIC front/back copies, and PKR 3,000 fee deposit screenshot.
        </p>
      </div>

      {/* EasyPaisa Fee Payment Highlight Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-6 rounded-2xl border-2 border-amber-400 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-black text-[10px] uppercase rounded">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Registration Fee & EasyPaisa Details</span>
            </div>
            <h3 className="text-xl font-extrabold text-amber-300">Registration Fee: PKR 3,000 (Pakistani)</h3>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-xl">
              Please send the <strong>PKR 3,000 registration fee</strong> via EasyPaisa to the official account below and upload the transaction screenshot in Section 5 below.
            </p>
          </div>

          <div className="bg-emerald-950/90 border-2 border-amber-400/80 p-4 rounded-xl text-xs space-y-2 shrink-0 min-w-[260px] shadow-lg">
            <div className="flex justify-between items-center pb-1.5 border-b border-amber-400/30">
              <span className="text-amber-300 font-bold uppercase text-[10px]">Fee Amount</span>
              <span className="text-amber-300 font-black text-sm">PKR 3,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-200 text-[11px]">EasyPaisa No:</span>
              <div className="flex items-center gap-1">
                <strong className="text-white font-mono text-sm tracking-wider">03459193927</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('03459193927');
                    showNotification('EasyPaisa Number copied: 03459193927');
                  }}
                  className="p-1 hover:bg-amber-400/20 text-amber-300 rounded"
                  title="Copy Number"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-200 text-[11px]">Account Title:</span>
              <strong className="text-amber-300 font-bold text-xs uppercase">Irfan Mateen</strong>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-xs">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-900 uppercase border-b pb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-800 text-amber-300 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
            <span>Personal Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Muhammad Ali"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Father/Guardian Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Ahmad Khan"
                value={formData.fatherName}
                onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Gender *</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700">CNIC / Form-B Number (Private) *</label>
              <input
                type="text"
                required
                placeholder="12345-6789012-3"
                value={formData.cnicNumber}
                onChange={e => setFormData({ ...formData, cnicNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Upload Credentials: Passport Photo & CNIC Copies */}
        <div className="space-y-4 pt-2 border-t">
          <h3 className="text-sm font-bold text-emerald-900 uppercase border-b pb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-800 text-amber-300 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
            <span>Identity Verification Uploads (Passport Photo & CNIC)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Passport Size Picture Upload */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>Passport Size Picture *</span>
                </label>
                {formData.passportPhotoUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Uploaded</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Formal passport size photograph on blue or white background.
              </p>

              {formData.passportPhotoUrl ? (
                <div className="space-y-2">
                  <img
                    src={formData.passportPhotoUrl}
                    alt="Passport Size Upload"
                    className="w-24 h-28 object-cover rounded border-2 border-emerald-700 shadow-sm mx-auto"
                  />
                  <label className="block text-center cursor-pointer text-[11px] font-bold text-amber-700 hover:underline">
                    <span>Change Photograph</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'passportPhotoUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-600/60 bg-emerald-50/50 hover:bg-emerald-50 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-2 text-center transition-colors">
                  <Upload className="w-6 h-6 text-emerald-700" />
                  <span className="font-bold text-emerald-900 text-xs">Upload Passport Photo</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG up to 8MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => handleFileUpload(e, 'passportPhotoUrl')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* CNIC Front Upload */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>CNIC Front Side *</span>
                </label>
                {formData.cnicFrontUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Uploaded</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Clear scanned copy or photo of CNIC / Form-B front side.
              </p>

              {formData.cnicFrontUrl ? (
                <div className="space-y-2">
                  <img
                    src={formData.cnicFrontUrl}
                    alt="CNIC Front"
                    className="w-full h-28 object-cover rounded border-2 border-emerald-700 shadow-sm"
                  />
                  <label className="block text-center cursor-pointer text-[11px] font-bold text-amber-700 hover:underline">
                    <span>Change CNIC Front</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'cnicFrontUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-600/60 bg-emerald-50/50 hover:bg-emerald-50 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-2 text-center transition-colors">
                  <Upload className="w-6 h-6 text-emerald-700" />
                  <span className="font-bold text-emerald-900 text-xs">Upload CNIC Front</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG up to 8MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => handleFileUpload(e, 'cnicFrontUrl')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* CNIC Back Upload */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>CNIC Back Side *</span>
                </label>
                {formData.cnicBackUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Uploaded</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Clear scanned copy or photo of CNIC / Form-B back side.
              </p>

              {formData.cnicBackUrl ? (
                <div className="space-y-2">
                  <img
                    src={formData.cnicBackUrl}
                    alt="CNIC Back"
                    className="w-full h-28 object-cover rounded border-2 border-emerald-700 shadow-sm"
                  />
                  <label className="block text-center cursor-pointer text-[11px] font-bold text-amber-700 hover:underline">
                    <span>Change CNIC Back</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'cnicBackUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-600/60 bg-emerald-50/50 hover:bg-emerald-50 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-2 text-center transition-colors">
                  <Upload className="w-6 h-6 text-emerald-700" />
                  <span className="font-bold text-emerald-900 text-xs">Upload CNIC Back</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG up to 8MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => handleFileUpload(e, 'cnicBackUrl')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

          </div>
        </div>

        {/* Regional & Contact Details */}
        <div className="space-y-4 pt-2 border-t">
          <h3 className="text-sm font-bold text-emerald-900 uppercase border-b pb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-800 text-amber-300 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
            <span>Regional & Contact Details</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700">Province / Territory *</label>
              <select
                value={formData.province}
                onChange={e => setFormData({ ...formData, province: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              >
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Islamabad Capital Territory">Islamabad CT</option>
                <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                <option value="Azad Jammu & Kashmir">AJK</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700">District *</label>
              <input
                type="text"
                required
                placeholder="e.g., Peshawar, Swat, Lahore"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">City / Town *</label>
              <input
                type="text"
                required
                placeholder="e.g., Peshawar"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Phone / WhatsApp *</label>
              <input
                type="text"
                required
                placeholder="0300-1234567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Emergency Contact</label>
              <input
                type="text"
                placeholder="0300-7654321"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700">Full Residential Address (Private) *</label>
            <input
              type="text"
              required
              placeholder="House #, Street, Colony, City"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
            />
          </div>
        </div>

        {/* Background & Committee Preference */}
        <div className="space-y-4 pt-2 border-t">
          <h3 className="text-sm font-bold text-emerald-900 uppercase border-b pb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-800 text-amber-300 rounded-full flex items-center justify-center text-[10px] font-black">4</span>
            <span>Background & Committee Preference</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Highest Education *</label>
              <input
                type="text"
                required
                placeholder="e.g. BS Political Science, FSC"
                value={formData.education}
                onChange={e => setFormData({ ...formData, education: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Institution / University *</label>
              <input
                type="text"
                required
                placeholder="e.g. University of Peshawar"
                value={formData.institution}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Preferred Standing Committee *</label>
            <select
              value={formData.preferredCommittee}
              onChange={e => setFormData({ ...formData, preferredCommittee: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
            >
              <option value="Standing Committee on Education & Youth Skill Development">Standing Committee on Education & Skills</option>
              <option value="Standing Committee on Climate Change & Environmental Protection">Standing Committee on Climate Change</option>
              <option value="Standing Committee on Information & Broadcasting">Standing Committee on Information & Media</option>
              <option value="Standing Committee on Zakat, Social Welfare & Poverty Alleviation">Standing Committee on Zakat & Welfare</option>
              <option value="Standing Committee on Global Youth Affairs & International Relations">Standing Committee on Global Youth Affairs</option>
              <option value="Standing Committee on Constitutional & Legal Affairs">Standing Committee on Constitutional Affairs</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700">Why do you want to join Youth Senate of Pakistan? *</label>
            <textarea
              required
              rows={3}
              value={formData.whyJoin}
              onChange={e => setFormData({ ...formData, whyJoin: e.target.value })}
              placeholder="Describe your motivation, civic goals, and how you wish to represent your district..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
            />
          </div>
        </div>

        {/* Section 5: Fee Payment & Screenshot Upload */}
        <div className="space-y-4 pt-2 border-t">
          <h3 className="text-sm font-bold text-emerald-900 uppercase border-b pb-2 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-800 text-amber-300 rounded-full flex items-center justify-center text-[10px] font-black">5</span>
            <span>Registration Fee & EasyPaisa Deposit Receipt (PKR 3,000)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-3">
              <h4 className="font-extrabold text-emerald-950 text-xs uppercase flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>EasyPaisa Payment Instructions</span>
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                <li>• Transfer <strong>PKR 3,000</strong> using your EasyPaisa App or USSD Code (*786#).</li>
                <li>• EasyPaisa Account Number: <strong className="text-emerald-900 bg-amber-200 px-1 py-0.5 rounded font-mono">03459193927</strong></li>
                <li>• Account Title: <strong className="text-emerald-900">IRFAN MATEEN</strong></li>
                <li>• Take a screenshot of the successful transaction or receipt.</li>
                <li>• Upload the screenshot in the field on the right side.</li>
              </ul>
            </div>

            {/* Payment Screenshot Upload */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>EasyPaisa Fee Deposit Screenshot *</span>
                </label>
                {formData.paymentReceiptUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Uploaded</span>
                )}
              </div>

              {formData.paymentReceiptUrl ? (
                <div className="space-y-2">
                  <img
                    src={formData.paymentReceiptUrl}
                    alt="Payment Screenshot"
                    className="w-full h-36 object-contain rounded border-2 border-emerald-700 shadow-sm bg-white p-1"
                  />
                  <label className="block text-center cursor-pointer text-[11px] font-bold text-amber-700 hover:underline">
                    <span>Change Screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'paymentReceiptUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-amber-500 bg-amber-50/50 hover:bg-amber-50 p-6 rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-2 text-center transition-colors">
                  <Upload className="w-8 h-8 text-amber-600" />
                  <span className="font-bold text-emerald-950 text-xs">Upload EasyPaisa Screenshot</span>
                  <span className="text-[10px] text-slate-500">Attach payment receipt photo/screenshot (PKR 3,000)</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => handleFileUpload(e, 'paymentReceiptUrl')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Declaration & Submission */}
        <div className="space-y-4 pt-2 border-t">
          <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 rounded-lg border">
            <input
              type="checkbox"
              required
              checked={formData.termsAccepted}
              onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-[11px] text-slate-700 leading-relaxed">
              I hereby declare that all information provided above is true and accurate to the best of my knowledge. I have transferred the registration fee of PKR 3,000 to EasyPaisa Account 03459193927 (Irfan Mateen) and attached my genuine passport photo, CNIC copies, and payment screenshot. I agree to abide by the Constitution and Code of Conduct of Youth Senate of Pakistan.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-emerald-950 font-black text-sm uppercase rounded-xl shadow-xl border-2 border-amber-600 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting Application...' : 'Submit Official Application & Uploads'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

