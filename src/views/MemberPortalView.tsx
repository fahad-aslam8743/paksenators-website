import React, { useState } from 'react';
import { useYSP } from '../context/YSPContext';
import { fetchApi } from '../lib/api';
import { Senator } from '../types/ysp';
import { Landmark, User, Award, Calendar, CheckCircle2, QrCode, LogOut, ShieldCheck, Mail, Lock } from 'lucide-react';

export const MemberPortalView: React.FC = () => {
  const { currentUser, setCurrentUser, logout, showNotification, navigate } = useYSP();

  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoggingIn(true);
    try {
      const res = await fetchApi<{ success: boolean; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      if (res.success) {
        setCurrentUser(res.user);
        showNotification(`Welcome, ${res.user.name}!`);
      }
    } catch (e: any) {
      showNotification(e.message || 'Login failed', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white p-8 rounded-2xl border-2 border-emerald-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-amber-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Senator / Member Portal</h1>
            <p className="text-xs text-slate-500">Sign in using your Membership ID or Email</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Membership ID / Email</label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. YSP-2025-0101 or email@domain.com"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="Password from your welcome email"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase rounded"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In To Portal'}
            </button>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">Demo Login Credentials:</p>
              <p>• Senator Login: <code className="font-mono bg-white px-1">YSP-2025-0101</code></p>
              <p>• Admin Login: <code className="font-mono bg-white px-1">admin@youthsenate.pk</code> / <code className="font-mono bg-white px-1">admin123</code></p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const profile: Senator | undefined = currentUser.senatorProfile;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      
      {/* Top Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Senator Workspace</span>
          <h1 className="text-3xl font-extrabold">{currentUser.name}</h1>
          <p className="text-xs text-emerald-200">
            Role: {currentUser.role} {profile ? `| ID: ${profile.membershipId}` : ''}
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-emerald-950 rounded font-bold text-xs uppercase flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Digital Membership Card Column */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase">Official Digital Membership Card</h3>
          
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 border-2 border-amber-400 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-amber-400/40 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">YOUTH SENATE OF PAKISTAN</div>
                  <div className="text-[9px] text-amber-400 uppercase tracking-widest">OFFICIAL MEMBER CARD</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-amber-500 text-emerald-950 font-black text-[10px] rounded uppercase">
                {profile?.membershipId || 'YSP-2025-0101'}
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <img
                src={profile?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
                alt={currentUser.name}
                className="w-20 h-24 rounded-lg object-cover border-2 border-amber-400"
              />
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-sm text-white">{currentUser.name}</h4>
                <p className="text-amber-300 font-bold">{profile?.designation || 'Youth Senator'}</p>
                <p className="text-[11px] text-emerald-200">{profile?.district || 'Islamabad'}, {profile?.province || 'ICT'}</p>
                <p className="text-[10px] text-slate-300">Valid Until: {profile?.validUntil || '2026-12-31'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-400/40 flex justify-between items-center text-[10px] text-emerald-200">
              <div>
                <span>Committee: </span>
                <strong className="text-amber-300">{profile?.committeeName || 'Education Standing Committee'}</strong>
              </div>
              <div className="bg-white p-1 rounded">
                <QrCode className="w-8 h-8 text-slate-900" />
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full py-2 bg-emerald-800 text-white font-bold text-xs uppercase rounded text-center hover:bg-emerald-900"
          >
            Print Digital Membership Card
          </button>
        </div>

        {/* Details & Activity */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Senator Profile Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-bold text-slate-800">{currentUser.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Joining Date:</span>
                <p className="font-bold text-slate-800">{profile?.joiningDate || '2025-01-15'}</p>
              </div>
              <div>
                <span className="text-slate-500">Attendance Percentage:</span>
                <p className="font-bold text-emerald-700">{profile?.attendancePercentage || 100}%</p>
              </div>
              <div>
                <span className="text-slate-500">Sessions Attended:</span>
                <p className="font-bold text-slate-800">{profile?.sessionsAttendedCount || 8}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900">Parliamentary Role</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {profile?.biography || 'Active member representing district in standing committee meetings and national parliamentary sittings.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
