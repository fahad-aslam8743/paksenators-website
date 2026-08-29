import React, { useState, useEffect } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { EventItem } from '../types/ysp';
import { Calendar, MapPin, CheckCircle2, UserCheck, Send } from 'lucide-react';

export const EventsView: React.FC = () => {
  const { navigate, currentViewParam, showNotification } = useYSP();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Registration Form
  const [regForm, setRegForm] = useState({
    fullName: '',
    fatherName: '',
    email: '',
    phone: '',
    district: '',
    province: 'Punjab',
    membershipNumber: '',
    organization: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<EventItem[]>('/events').then(setEvents).catch(console.warn);
  }, []);

  const openRegisterModal = (evt: EventItem) => {
    setSelectedEvent(evt);
    setRegistrationResult(null);
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const res = await fetchApi<{ success: boolean; registrationId: string }>('/events/register', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          ...regForm
        })
      });
      setRegistrationResult(res.registrationId);
      showNotification(`Event registration submitted! ID: ${res.registrationId}`);
    } catch (e: any) {
      showNotification(e.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Conventions & Workshops</span>
        <h1 className="text-3xl font-extrabold">Events & Activities</h1>
        <p className="text-xs text-emerald-100 max-w-2xl">
          Participate in Youth Senate seminars, national conventions, parliamentary workshops, and community campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(evt => (
          <div key={evt.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <img src={evt.imageUrl} alt={evt.title} className="w-full h-44 object-cover" />
              <div className="p-5 space-y-3">
                <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  {evt.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2">{evt.title}</h3>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-600" /> {evt.date} • {evt.time}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {evt.venue}, {evt.city}</div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">{evt.description}</p>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => openRegisterModal(evt)}
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded text-center transition-colors"
              >
                Register For Event
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {registerModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 relative border-2 border-emerald-800 shadow-2xl my-8">
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 font-bold"
            >
              ✕
            </button>

            <div className="border-b pb-3">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Event Registration</span>
              <h3 className="text-lg font-bold text-slate-900">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500">{selectedEvent.date} • {selectedEvent.venue}</p>
            </div>

            {registrationResult ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold">Registration Confirmed!</h4>
                <p className="text-xs">Your Event Registration ID is:</p>
                <div className="text-xl font-black text-amber-600 bg-white py-2 px-4 rounded border border-amber-300 inline-block">
                  {registrationResult}
                </div>
                <p className="text-xs text-slate-600">Please save your Registration ID for attendance check-in.</p>
                <button
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-6 py-2 bg-emerald-800 text-white font-bold text-xs uppercase rounded"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Father/Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.fatherName}
                      onChange={e => setRegForm({ ...regForm, fatherName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Province *</label>
                    <select
                      value={regForm.province}
                      onChange={e => setRegForm({ ...regForm, province: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
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
                      value={regForm.district}
                      onChange={e => setRegForm({ ...regForm, district: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Organization / Institution</label>
                  <input
                    type="text"
                    value={regForm.organization}
                    onChange={e => setRegForm({ ...regForm, organization: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded"
                >
                  {submitting ? 'Submitting Registration...' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
