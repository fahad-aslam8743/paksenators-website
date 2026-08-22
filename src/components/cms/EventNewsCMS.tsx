import React, { useState, useEffect, useRef } from 'react';
import { EventItem, NewsItem } from '../../types/ysp';
import { useYSP } from '../../context/YSPContext';
import { fetchApi } from '../../lib/api';
import { ImageUploader, ImageUploaderRef } from '../ImageUploader';
import { Calendar, Newspaper, Plus, Edit, Trash2, Save, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const EventNewsCMS: React.FC = () => {
  const { showNotification } = useYSP();
  const [activeTab, setActiveTab] = useState<'events' | 'news'>('events');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // REUSABLE IMAGE UPLOADER refs — same working pattern as Executive Leadership.
  const eventImageUploaderRef = useRef<ImageUploaderRef>(null);
  const newsImageUploaderRef = useRef<ImageUploaderRef>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [eventForm, setEventForm] = useState<Partial<EventItem>>({
    title: '',
    category: 'Youth Conferences',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    venue: 'Youth Senate Secretariat Auditorium',
    city: 'Peshawar',
    district: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    description: 'National youth convention bringing together youth representatives across districts.',
    imageUrl: '/src/assets/images/ysp_official_logo_1786441197850.jpg',
    registrationOpen: true
  });

  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    title: '',
    slug: 'youth-senate-update',
    category: 'Official Statement',
    date: new Date().toISOString().split('T')[0],
    author: 'Youth Senate Press Secretariat',
    excerpt: 'Official press release issued by the Youth Senate of Pakistan.',
    content: 'Full details of the press release.',
    imageUrl: '/src/assets/images/ysp_official_logo_1786441197850.jpg',
    isPublished: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eData, nData] = await Promise.all([
        fetchApi<EventItem[]>('/events'),
        fetchApi<NewsItem[]>('/news')
      ]);
      if (eData) setEvents(eData);
      if (nData) setNews(nData);
    } catch (e) {
      console.warn('Failed to load events & news', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);
    try {
      // Execute the cover photo upload (if a new file was selected) —
      // same working pattern as Executive Leadership.
      let finalImageUrl = eventForm.imageUrl || '';
      if (eventImageUploaderRef.current) {
        const uploadRes = await eventImageUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalImageUrl = uploadRes.downloadUrl;
        }
      }
      const payload = { ...eventForm, imageUrl: finalImageUrl };
      setEventForm(payload);

      if (editingId) {
        await fetchApi(`/events/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification('Event updated successfully!', 'success');
      } else {
        await fetchApi('/events', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification('New event published!', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      const msg = e.message || 'Failed to save event.';
      setUploadError(msg);
      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);
    try {
      // Execute the press photo upload (if a new file was selected) —
      // same working pattern as Executive Leadership.
      let finalImageUrl = newsForm.imageUrl || '';
      if (newsImageUploaderRef.current) {
        const uploadRes = await newsImageUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalImageUrl = uploadRes.downloadUrl;
        }
      }
      const payload = { ...newsForm, imageUrl: finalImageUrl };
      setNewsForm(payload);

      if (editingId) {
        await fetchApi(`/news/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification('News post updated!', 'success');
      } else {
        await fetchApi('/news', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification('News article published!', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      const msg = e.message || 'Failed to save news.';
      setUploadError(msg);
      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this event listing?')) return;
    try {
      await fetchApi(`/events/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('Event removed.', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete event.', 'error');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Delete this news release?')) return;
    try {
      await fetchApi(`/news/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('News article removed.', 'success');
    } catch (e: any) {
      showNotification(e.message || 'Failed to delete news article.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-800" />
        <p className="mt-2 text-xs font-bold">Loading Events & News Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 admin-glass-card">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
            <Newspaper className="w-4 h-4 text-emerald-600" />
            <span>Content Publishing Center</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Events & Media News Manager</h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'events' ? 'bg-emerald-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'news' ? 'bg-emerald-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>News Releases ({news.length})</span>
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingId(null);
            setUploadError(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 admin-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'events' ? 'Add New Event' : 'Publish News Release'}</span>
        </button>
      </div>

      {/* Events View */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(item => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover rounded-xl border border-slate-200 bg-white" />
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                  {item.category}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-600 font-medium">{item.venue}, {item.city}</p>
                <p className="text-[11px] text-amber-700 font-bold">{item.date} | {item.time}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500">
                  {item.registrationOpen ? 'Registration Open' : 'Closed'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEventForm(item);
                      setUploadError(null);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(item.id)}
                    className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News View */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover rounded-xl border border-slate-200 bg-white" />
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] uppercase">
                  {item.category}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-600 font-medium line-clamp-2">{item.excerpt}</p>
                <p className="text-[11px] text-slate-500 font-semibold">{item.date} | By {item.author}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {item.isPublished ? 'Published' : 'Draft'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setNewsForm(item);
                      setUploadError(null);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNews(item.id)}
                    className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 sm:pt-24 z-[100] overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              {activeTab === 'events' ? (editingId ? 'Edit Event Details' : 'Publish New Event') : (editingId ? 'Edit News Article' : 'Publish News Release')}
            </h3>

            {activeTab === 'events' ? (
              <form onSubmit={handleSaveEvent} className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Date</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={e => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="w-full px-4 py-2 admin-input text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City / District</label>
                    <input
                      type="text"
                      value={eventForm.city}
                      onChange={e => setEventForm(prev => ({ ...prev, city: e.target.value, district: e.target.value }))}
                      required
                      className="w-full px-4 py-2 admin-input text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={e => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  />
                </div>

                <ImageUploader
                  ref={eventImageUploaderRef}
                  label="Upload Event Cover Photo"
                  currentPhotoUrl={eventForm.imageUrl}
                  folder="youth-senate/events"
                  onError={(err) => setUploadError(err)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    <span>Save Event</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNews} className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">News Headline</label>
                  <input
                    type="text"
                    value={newsForm.title}
                    onChange={e => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Excerpt Summary</label>
                  <textarea
                    rows={2}
                    value={newsForm.excerpt}
                    onChange={e => setNewsForm(prev => ({ ...prev, excerpt: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Article Content</label>
                  <textarea
                    rows={5}
                    value={newsForm.content}
                    onChange={e => setNewsForm(prev => ({ ...prev, content: e.target.value }))}
                    required
                    className="w-full px-4 py-2 admin-input text-xs font-medium"
                  />
                </div>

                <ImageUploader
                  ref={newsImageUploaderRef}
                  label="Upload News Press Photograph"
                  currentPhotoUrl={newsForm.imageUrl}
                  folder="youth-senate/news"
                  onError={(err) => setUploadError(err)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    <span>Publish Article</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
