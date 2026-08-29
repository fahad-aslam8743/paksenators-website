import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { uploadImageToFirebase, validateImageFile, deleteImageFromFirebase } from '../../lib/firebaseStorage';
import { GalleryCollection } from '../../types/ysp';
import { Images, Plus, Trash2, X, Upload, Loader2, RefreshCw, Pencil } from 'lucide-react';

/**
 * Lets an admin select several photos at once, give the whole set one
 * title and description, and publish them as a named album on the public
 * Photo Collections page. Existing collections can be reopened afterward
 * to add more photos, remove individual photos, or edit the title/
 * description — this isn't a one-shot publish-only flow.
 */
export const GalleryCollectionsCMS: React.FC = () => {
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // null = form closed. 'new' = creating. A GalleryCollection = editing that one.
  const [editing, setEditing] = useState<GalleryCollection | 'new' | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]); // already-published photos, when editing
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // newly-added, not yet uploaded
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetchApi<GalleryCollection[]>('/gallery-collections')
      .then(setCollections)
      .catch(console.warn)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => () => { previewUrls.forEach(u => URL.revokeObjectURL(u)); }, [previewUrls]);

  const openNew = () => {
    setEditing('new');
    setTitle('');
    setDescription('');
    setExistingPhotoUrls([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
  };

  const openEdit = (col: GalleryCollection) => {
    setEditing(col);
    setTitle(col.title);
    setDescription(col.description || '');
    setExistingPhotoUrls(col.photoUrls);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
  };

  const closeForm = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setEditing(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
    setUploadProgress(null);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(`"${file.name}": ${validation.error}`);
        return;
      }
    }

    // Additive — selecting again adds to what's already picked rather than
    // replacing it, since some phones' photo pickers only allow selecting
    // one image per visit to the picker.
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingPhoto = (url: string) => {
    setExistingPhotoUrls(prev => prev.filter(u => u !== url));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Please give this collection a title.'); return; }
    if (existingPhotoUrls.length + selectedFiles.length === 0) {
      setError('This collection needs at least one photo.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(selectedFiles.length > 0 ? { done: 0, total: selectedFiles.length } : null);

    try {
      const newlyUploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const result = await uploadImageToFirebase(file, 'youth-senate/gallery-collections');
        newlyUploadedUrls.push(result.downloadUrl);
        setUploadProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null);
      }

      const finalPhotoUrls = [...existingPhotoUrls, ...newlyUploadedUrls];

      if (editing === 'new') {
        await fetchApi('/gallery-collections', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            photoUrls: finalPhotoUrls,
            date: new Date().toISOString().split('T')[0]
          })
        });
      } else if (editing) {
        // Photos removed in this edit are no longer used anywhere in the
        // updated list — actually delete them from Cloudinary too, not
        // just drop them from this collection.
        const removedUrls = editing.photoUrls.filter(u => !finalPhotoUrls.includes(u));

        await fetchApi(`/gallery-collections/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            photoUrls: finalPhotoUrls
          })
        });

        for (const url of removedUrls) {
          const publicId = extractCloudinaryPublicId(url);
          if (publicId) deleteImageFromFirebase(publicId).catch(() => {});
        }
      }

      closeForm();
      load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save this collection. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCollection = async (col: GalleryCollection) => {
    if (!confirm(`Delete "${col.title}" and all its photos? This cannot be undone.`)) return;
    await fetchApi(`/gallery-collections/${col.id}`, { method: 'DELETE' });
    for (const url of col.photoUrls) {
      const publicId = extractCloudinaryPublicId(url);
      if (publicId) deleteImageFromFirebase(publicId).catch(() => {});
    }
    load();
  };

  const showForm = editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Images className="w-5 h-5 text-emerald-700" />
            Photo Gallery Collections
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select several photos at once, give them a title and description, and publish as an album. Click any existing collection to add or remove photos later.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {editing === 'new' ? 'New Photo Collection' : `Editing: ${(editing as GalleryCollection).title}`}
            </h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Session 12 — Peshawar Assembly"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of this collection..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {existingPhotoUrls.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Current Photos ({existingPhotoUrls.length})</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {existingPhotoUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {!uploading && (
                      <button
                        onClick={() => removeExistingPhoto(url)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-md"
                        title="Remove this photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              {existingPhotoUrls.length > 0 ? 'Add More Photos' : 'Photos'} ({selectedFiles.length} newly selected)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
              id="gallery-collection-file-input"
            />
            <label
              htmlFor="gallery-collection-file-input"
              className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-6 text-xs font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Click to select photos (tap again to add more)
            </label>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-emerald-300">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {!uploading && (
                      <button
                        onClick={() => removeNewFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-md"
                        title="Remove this photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={uploading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-emerald-950 text-xs font-black uppercase rounded-lg flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress ? `Uploading ${uploadProgress.done}/${uploadProgress.total}` : 'Saving...'}
                </>
              ) : editing === 'new' ? 'Publish Collection' : 'Save Changes'}
            </button>
            {!uploading && (
              <button onClick={closeForm} className="text-xs font-bold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Loading collections...</p>
      ) : collections.length === 0 ? (
        <p className="text-xs text-slate-400">No photo collections published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <div key={col.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 h-32">
                {col.photoUrls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full h-full object-cover" />
                ))}
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{col.title}</h4>
                <p className="text-xs text-slate-500">{col.photoUrls.length} photo{col.photoUrls.length !== 1 ? 's' : ''} • {col.date}</p>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => openEdit(col)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(col)}
                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v169.../folder/name.jpg
 * The public_id (needed to delete the file) is everything after the
 * version segment (v169...), with the file extension stripped.
 */
function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}
