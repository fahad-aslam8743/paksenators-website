import React, { useEffect, useState } from 'react';
import { ContactMessage } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
import { optimisticUpdate, optimisticDelete } from '../../lib/optimistic';
import { Mail, Search, Trash2, Phone, Calendar, MailOpen, CircleDot, X } from 'lucide-react';

export const ContactMessagesCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [openMessage, setOpenMessage] = useState<ContactMessage | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<ContactMessage[]>('/contact');
      if (data) {
        // Newest first — the whole point of this screen is "did anyone
        // just write in", so the latest message should never be buried.
        setMessages([...data].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')));
      }
    } catch (e) {
      console.warn('Failed to load contact messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleOpen = async (msg: ContactMessage) => {
    setOpenMessage(msg);
    if (!msg.isRead) {
      // Marking as read is itself a normal optimistic update — the modal
      // opens instantly, the "unread" dot disappears instantly, and the
      // Firestore write happens in the background.
      await optimisticUpdate<ContactMessage>(
        messages, setMessages, '/contact', msg.id, { isRead: true },
        showNotification,
        { success: '', failure: 'Could not mark message as read.' }
      );
    }
  };

  const handleDelete = async (msg: ContactMessage) => {
    if (!window.confirm(`Delete the message from "${msg.name}"? This cannot be undone.`)) return;
    setOpenMessage(null);
    await optimisticDelete(
      messages, setMessages, '/contact', msg.id,
      showNotification,
      { success: 'Message deleted.', failure: 'Failed to delete message.' }
    );
  };

  const filtered = messages.filter(m => {
    const matchesFilter = filter === 'ALL' || (filter === 'UNREAD' ? !m.isRead : m.isRead);
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchLower) ||
      (m.email || '').toLowerCase().includes(searchLower) ||
      (m.subject || '').toLowerCase().includes(searchLower) ||
      (m.message || '').toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-800" />
            Contact Messages
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <button
            onClick={loadMessages}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, subject, or message..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none"
            />
          </div>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'UNREAD', 'READ'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  filter === f ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'UNREAD' ? 'Unread' : 'Read'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 italic p-6 text-center">Loading messages...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-8 bg-slate-50 rounded-xl text-center">
            {messages.length === 0
              ? 'No contact messages have been received yet.'
              : 'No messages match your current search/filter.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleOpen(msg)}
                className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition ${
                  msg.isRead
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
                }`}
              >
                <div className="pt-1">
                  {!msg.isRead && <CircleDot className="w-3.5 h-3.5 text-emerald-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h4 className={`text-sm truncate ${msg.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>
                      {msg.name || 'Unknown'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {msg.submittedAt ? new Date(msg.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${msg.isRead ? 'text-slate-500' : 'text-slate-700 font-semibold'}`}>
                    {msg.subject || '(No subject)'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {openMessage && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpenMessage(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">{openMessage.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{openMessage.subject || '(No subject)'}</p>
                </div>
                <button onClick={() => setOpenMessage(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-slate-600 font-medium">
                <a href={`mailto:${openMessage.email}`} className="flex items-center gap-1.5 text-emerald-800 hover:underline">
                  <Mail className="w-3.5 h-3.5" /> {openMessage.email}
                </a>
                {openMessage.phone && (
                  <a href={`tel:${openMessage.phone}`} className="flex items-center gap-1.5 text-emerald-800 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {openMessage.phone}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {openMessage.submittedAt ? new Date(openMessage.submittedAt).toLocaleString() : ''}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <MailOpen className="w-3.5 h-3.5" /> Read
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{openMessage.message}</p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleDelete(openMessage)}
                  className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <a
                  href={`mailto:${openMessage.email}?subject=${encodeURIComponent(`Re: ${openMessage.subject || 'Your message'}`)}`}
                  className="px-5 py-2 admin-btn-primary text-xs"
                >
                  Reply by Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
