import React, { useState, useEffect, useRef } from 'react';
import { 
  VideoItem, 
  VideoCategory 
} from '../types/ysp';
import { 
  getVideosFromFirestore, 
  saveVideoToFirestore, 
  deleteVideoFromFirestore, 
  toggleVideoStatusInFirestore,
  deleteVideoFromFirebase 
} from '../lib/firebaseVideo';
import { VideoUploader, VideoUploaderRef } from './VideoUploader';
import { VideoPlayer, isYouTubeUrl, getYouTubeVideoId } from './VideoPlayer';
import { ImageUploader, ImageUploaderRef } from './ImageUploader';
import { 
  Film, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Play, 
  ShieldCheck, 
  Sparkles,
  ArrowUpDown,
  UploadCloud,
  X
} from 'lucide-react';

interface VideoManagementCMSProps {
  onNotification?: (msg: string, type?: 'success' | 'error') => void;
}

const CATEGORIES: VideoCategory[] = [
  'Parliamentary Sessions',
  'Youth Senate Events',
  'Seminars',
  'Conferences',
  'Training Sessions',
  'District Activities',
  'Media Coverage',
  'Interviews',
  'Official Messages',
  'Independence Events',
  'Awareness Programs',
  'Other'
];

export const VideoManagementCMS: React.FC<VideoManagementCMSProps> = ({ onNotification }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState<boolean>(false);

  // REUSABLE IMAGE UPLOADER ref for the optional thumbnail — same
  // working pattern as Executive Leadership (upload only actually
  // happens when we call thumbnailUploaderRef.current.uploadImage()).
  const thumbnailUploaderRef = useRef<ImageUploaderRef>(null);

  // Same ref-triggered-on-save pattern for the main video file.
  const videoUploaderRef = useRef<VideoUploaderRef>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    description: string;
    category: VideoCategory;
    videoUrl: string;
    storagePath: string;
    thumbnailUrl: string;
    thumbnailStoragePath: string;
    duration: string;
    status: 'published' | 'unpublished';
    sortOrder: number;
    uploadedBy: string;
  }>({
    id: '',
    title: '',
    description: '',
    category: 'Parliamentary Sessions',
    videoUrl: '',
    storagePath: '',
    thumbnailUrl: '',
    thumbnailStoragePath: '',
    duration: '',
    status: 'published',
    sortOrder: 1,
    uploadedBy: 'Administrator'
  });

  // Admin Video Preview Modal
  const [previewingVideo, setPreviewingVideo] = useState<VideoItem | null>(null);

  // Delete Confirmation Modal
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);

  // Replace Video Mode flag
  const [isReplacingVideo, setIsReplacingVideo] = useState<boolean>(false);
  const [pendingOldStoragePath, setPendingOldStoragePath] = useState<string>('');

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await getVideosFromFirestore();
      setVideos(data);
    } catch (e) {
      console.error('Failed to load videos:', e);
      if (onNotification) onNotification('Failed to fetch videos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleOpenAddForm = () => {
    setEditingVideo(null);
    setIsReplacingVideo(false);
    setPendingOldStoragePath('');
    setUploadError(null);
    setFormData({
      id: `vid-${Date.now()}`,
      title: '',
      description: '',
      category: 'Parliamentary Sessions',
      videoUrl: '',
      storagePath: '',
      thumbnailUrl: '',
      thumbnailStoragePath: '',
      duration: '',
      status: 'published',
      sortOrder: videos.length + 1,
      uploadedBy: 'Administrator'
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (video: VideoItem) => {
    setEditingVideo(video);
    setIsReplacingVideo(false);
    setPendingOldStoragePath(video.storagePath);
    setUploadError(null);
    setFormData({
      id: video.id,
      title: video.title,
      description: video.description || '',
      category: video.category,
      videoUrl: video.videoUrl,
      storagePath: video.storagePath,
      thumbnailUrl: video.thumbnailUrl || '',
      thumbnailStoragePath: video.thumbnailStoragePath || '',
      duration: video.duration || '',
      status: video.status,
      sortOrder: video.sortOrder || 1,
      uploadedBy: video.uploadedBy || 'Administrator'
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      if (onNotification) onNotification('Video title is required.', 'error');
      return;
    }

    setUploadError(null);
    setSavingForm(true);

    try {
      // Finalize the main video upload now (select file -> upload happens
      // on Save), same working pattern as every other upload in the panel.
      let finalVideoUrl = formData.videoUrl;
      let finalStoragePath = formData.storagePath;
      const videoResult = await videoUploaderRef.current?.uploadVideo();
      if (videoResult) {
        finalVideoUrl = videoResult.downloadUrl;
        finalStoragePath = videoResult.storagePath;
      }

      if (!finalVideoUrl) {
        if (onNotification) onNotification('Please select a video file to upload.', 'error');
        setSavingForm(false);
        return;
      }

      // Execute the optional thumbnail upload (if a new file was
      // selected) via the ImageUploader component — same working
      // pattern as Executive Leadership.
      let finalThumbnailUrl = formData.thumbnailUrl || '';
      let finalThumbnailStoragePath = formData.thumbnailStoragePath || '';
      if (thumbnailUploaderRef.current) {
        const uploadRes = await thumbnailUploaderRef.current.uploadImage();
        if (uploadRes) {
          finalThumbnailUrl = uploadRes.downloadUrl;
          finalThumbnailStoragePath = uploadRes.storagePath;
        }
      }

      // If we replaced video and uploaded new file, delete old storage path
      if (isReplacingVideo && pendingOldStoragePath && pendingOldStoragePath !== finalStoragePath) {
        await deleteVideoFromFirebase(pendingOldStoragePath);
      }

      const saved = await saveVideoToFirestore({
        id: formData.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        videoUrl: finalVideoUrl,
        storagePath: finalStoragePath,
        thumbnailUrl: finalThumbnailUrl,
        thumbnailStoragePath: finalThumbnailStoragePath,
        duration: videoResult?.duration || formData.duration,
        status: formData.status,
        sortOrder: Number(formData.sortOrder) || 1,
        uploadedBy: formData.uploadedBy || 'Administrator'
      });

      // Optimistic update: reflect the change in the list immediately.
      setVideos(prev => {
        const exists = prev.some(v => v.id === saved.id);
        return exists ? prev.map(v => (v.id === saved.id ? saved : v)) : [saved, ...prev];
      });

      if (onNotification) {
        onNotification(editingVideo ? 'Video updated successfully!' : 'Original Video published successfully!');
      }

      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save video:', err);
      const msg = err.message || 'Failed to save video.';
      setUploadError(msg);
      if (onNotification) onNotification(msg, 'error');
      await loadVideos(); // re-sync in case of partial failure
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleStatus = async (video: VideoItem) => {
    const newStatus = video.status === 'published' ? 'unpublished' : 'published';
    try {
      await toggleVideoStatusInFirestore(video.id, newStatus);
      setVideos(prev =>
        prev.map(v => (v.id === video.id ? { ...v, status: newStatus } : v))
      );
      if (onNotification) {
        onNotification(`Video status changed to ${newStatus.toUpperCase()}`);
      }
    } catch (e: any) {
      if (onNotification) onNotification('Failed to change status.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideo) return;
    const previousVideos = videos;
    const target = deletingVideo;
    setVideos(prev => prev.filter(v => v.id !== target.id)); // optimistic removal
    setDeletingVideo(null);
    try {
      await deleteVideoFromFirestore(
        target.id,
        target.storagePath,
        target.thumbnailStoragePath
      );
      if (onNotification) onNotification('Video deleted permanently.');
    } catch (e: any) {
      if (onNotification) onNotification('Failed to delete video.', 'error');
      setVideos(previousVideos); // roll back
    }
  };

  // Filtered list
  const filteredVideos = videos.filter(vid => {
    const matchesSearch = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || vid.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || vid.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* CMS Header Bar */}
      <div className="bg-emerald-950 text-white p-6 rounded-2xl border-b-4 border-amber-500 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black tracking-tight">Official Video Archives CMS</h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Upload, manage, replace, publish, or remove original Youth Senate master video recordings. All uploaded files are preserved in original format.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={loadVideos}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold text-xs uppercase rounded-xl border border-emerald-700/80 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Video</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search videos by title or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories ({videos.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video List Table / Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Fetching original video records from Firebase...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Film className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Videos Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No video records match your current search or category filter. Click "Upload New Video" to add an original video.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] uppercase font-black text-slate-600 tracking-wider">
                  <th className="py-3 px-4">Video Preview</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                {filteredVideos.map(vid => (
                  <tr key={vid.id} className="hover:bg-slate-50 transition-colors">
                    {/* Preview Thumbnail */}
                    <td className="py-3 px-4 w-36">
                      <div 
                        onClick={() => setPreviewingVideo(vid)}
                        className="relative w-32 h-20 bg-slate-900 rounded-lg overflow-hidden cursor-pointer group border border-slate-300 shadow-sm shrink-0"
                      >
                        {vid.thumbnailUrl ? (
                          <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : isYouTubeUrl(vid.videoUrl) ? (
                          <img
                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(vid.videoUrl)}/hqdefault.jpg`}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <video src={vid.videoUrl} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex items-center justify-center transition-colors">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center shadow-md">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        {vid.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {vid.duration}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Info */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{vid.title}</h4>
                        <p className="text-slate-500 text-[11px] line-clamp-2">{vid.description || 'No description provided.'}</p>
                        <span className="text-[10px] font-mono text-emerald-800 font-bold block">
                          Uploader: {vid.uploadedBy || 'Administrator'}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[10px] uppercase rounded-full border border-amber-300 inline-block">
                        {vid.category}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(vid)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 border transition-all ${
                          vid.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {vid.status === 'published' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>Unpublished</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(vid.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewingVideo(vid)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Preview Video"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(vid)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors"
                          title="Edit Metadata & Replace File"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingVideo(vid)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL: Add / Edit Video */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-6 my-8 relative space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Master Video Manager</span>
                <h3 className="text-xl font-black">
                  {editingVideo ? 'Edit / Replace Video Recording' : 'Upload New Original Video'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">

              {uploadError && (
                <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* VIDEO UPLOADER COMPONENT */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold uppercase text-amber-400">
                    Step 1 — Video File (Required) · Uploads automatically on Save
                  </label>
                  {editingVideo && !isReplacingVideo && (
                    <button
                      type="button"
                      onClick={() => setIsReplacingVideo(true)}
                      className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Replace Master Video File</span>
                    </button>
                  )}
                </div>

                {(!editingVideo || isReplacingVideo || !formData.videoUrl) ? (
                  <VideoUploader
                    ref={videoUploaderRef}
                    currentVideoUrl={formData.videoUrl}
                    currentStoragePath={formData.storagePath}
                  />
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden">
                      <VideoPlayer videoUrl={formData.videoUrl} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="font-mono text-emerald-400 font-bold truncate">Current Master File: {formData.storagePath}</span>
                      <button
                        type="button"
                        onClick={() => setIsReplacingVideo(true)}
                        className="px-3 py-1 bg-amber-500 text-emerald-950 font-extrabold rounded-lg hover:bg-amber-400 transition-colors"
                      >
                        Replace Video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Video Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Session 14 Address by Founder Chairman"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as VideoCategory })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Provide parliamentary details, speakers, key discussion points..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Custom Thumbnail Upload (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Step 2 — Cover Thumbnail Photo (Optional, this is a photo not the video)</label>
                <ImageUploader
                  ref={thumbnailUploaderRef}
                  currentPhotoUrl={formData.thumbnailUrl}
                  currentStoragePath={formData.thumbnailStoragePath}
                  storageFolder="youth-senate/video-thumbnails"
                  onError={(err) => setUploadError(err)}
                  label="Upload Video Cover Photo"
                />
              </div>

              {/* Status & Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'published' | 'unpublished' })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="published">Published (Visible in Gallery)</option>
                    <option value="unpublished">Unpublished (Hidden / Draft)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Duration (e.g. 05:40)</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:40"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sortOrder}
                    onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs uppercase rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {savingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingForm ? 'Processing...' : (editingVideo ? 'Save Changes' : 'Publish Master Video')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PREVIEW VIDEO MODAL */}
      {previewingVideo && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24" onClick={() => setPreviewingVideo(null)}>
          <div className="max-w-4xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 p-6 relative space-y-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewingVideo(null)}
              className="absolute top-4 right-4 bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <VideoPlayer videoUrl={previewingVideo.videoUrl} autoPlay className="w-full h-full object-contain" title={previewingVideo.title} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase rounded-full border border-amber-500/30">
                  {previewingVideo.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(previewingVideo.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{previewingVideo.title}</h3>
              <p className="text-xs text-slate-300">{previewingVideo.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingVideo && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-start justify-center p-4 pt-20 sm:pt-24 overflow-y-auto">
          <div className="max-w-md w-full bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-950 rounded-full border border-red-700/80 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black">Confirm Video Deletion</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete <strong className="text-amber-400">"{deletingVideo.title}"</strong>?
              This will remove the master video recording from Firebase Storage and Firestore.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingVideo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl shadow-lg"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
