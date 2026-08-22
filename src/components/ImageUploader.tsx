import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  RefreshCw,
  Trash2,
  FolderPlus
} from 'lucide-react';
import { 
  validateImageFile, 
  uploadImageToFirebase, 
  deleteImageFromFirebase 
} from '../lib/firebaseStorage';

export interface ImageUploaderRef {
  uploadImage: () => Promise<{ downloadUrl: string; storagePath: string } | null>;
  getSelectedFile: () => File | null;
  getPreviewUrl: () => string;
}

interface ImageUploaderProps {
  currentPhotoUrl?: string;
  storagePath?: string;
  currentStoragePath?: string;
  folder?: string;
  storageFolder?: string;
  label?: string;
  onImageSelected?: (file: File | null, previewUrl: string | null) => void;
  onUploadSuccess?: (downloadUrl: string, storagePath: string) => void;
  onDeletePhoto?: () => void;
  onError?: (errorMessage: string) => void;
}

export const ImageUploader = forwardRef<ImageUploaderRef, ImageUploaderProps>(({
  currentPhotoUrl = '',
  storagePath = '',
  currentStoragePath = '',
  folder = 'youth-senate/leadership',
  storageFolder,
  label = 'Official Profile Photo',
  onImageSelected,
  onUploadSuccess,
  onDeletePhoto,
  onError
}, ref) => {
  const activeFolder = storageFolder || folder;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeStoragePath = storagePath || currentStoragePath;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(currentPhotoUrl);
    }
  }, [currentPhotoUrl, selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadSuccessMsg(false);

    // Image Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      const errMsg = validation.error || 'Invalid image file.';
      setError(errMsg);
      if (onError) onError(errMsg);
      return;
    }

    // Zero-latency local browser Object URL preview
    const immediateUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(immediateUrl);

    if (onImageSelected) {
      onImageSelected(file, immediateUrl);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Attempt to delete from storage if storage path exists
    if (activeStoragePath) {
      try {
        await deleteImageFromFirebase(activeStoragePath);
      } catch (e) {
        console.warn('Storage delete warning:', e);
      }
    }

    setSelectedFile(null);
    setPreviewUrl('');
    setError(null);
    setUploadSuccessMsg(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onDeletePhoto) {
      onDeletePhoto();
    }
    if (onImageSelected) {
      onImageSelected(null, '');
    }
  };

  const handleClearSelected = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(currentPhotoUrl);
    setError(null);
    setUploadSuccessMsg(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelected) {
      onImageSelected(null, currentPhotoUrl);
    }
  };

  const uploadImage = async (): Promise<{ downloadUrl: string; storagePath: string } | null> => {
    if (!selectedFile) {
      if (currentPhotoUrl) {
        return { downloadUrl: currentPhotoUrl, storagePath: activeStoragePath };
      }
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload actual file to Firebase Storage
      const result = await uploadImageToFirebase(selectedFile, activeFolder);

      // Delete old Storage image if replacing
      if (activeStoragePath && activeStoragePath !== result.storagePath) {
        try {
          await deleteImageFromFirebase(activeStoragePath);
        } catch (e) {
          console.warn('Could not remove old storage file:', e);
        }
      }

      setUploadSuccessMsg(true);
      setPreviewUrl(result.downloadUrl);
      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(result.downloadUrl, result.storagePath);
      }

      return result;
    } catch (err: any) {
      console.error('Firebase Storage upload error:', err);
      const msg = err.message || 'Image upload failed. Please verify connection.';
      setError(msg);
      if (onError) onError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    uploadImage,
    getSelectedFile: () => selectedFile,
    getPreviewUrl: () => previewUrl
  }));

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <label className="font-extrabold text-slate-900 uppercase text-xs flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-800" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
          JPG, PNG, WEBP (Max 10MB)
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Upload Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {uploadSuccessMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2.5 rounded text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Image uploaded and saved to Firebase Storage!</span>
        </div>
      )}

      {/* Uploader Body */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        
        {/* Preview Frame */}
        <div className="shrink-0 relative group flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={previewUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
              alt="Preview"
              className="w-28 h-36 object-contain object-center rounded-xl border-2 border-emerald-800 shadow-md bg-white transition-all"
            />
            {selectedFile && (
              <span className="absolute bottom-1 left-1 right-1 bg-amber-500 text-emerald-950 font-black text-[9px] uppercase px-1 py-0.5 rounded text-center truncate shadow">
                New Selection
              </span>
            )}
            {selectedFile && (
              <button
                type="button"
                onClick={handleClearSelected}
                className="absolute -top-2 -right-2 p-1 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow transition-colors"
                title="Reset Selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Explicit Delete Photo Button */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="w-full px-2 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-[10px] uppercase rounded-lg shadow flex items-center justify-center gap-1 transition-colors"
              title="Delete Photo"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Photo</span>
            </button>
          )}
        </div>

        {/* Action Button & Input */}
        <div className="space-y-3 flex-1 w-full">
          
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploading}
            className="w-full border-2 border-dashed border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/80 active:bg-emerald-200 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-sm group"
          >
            <Upload className="w-6 h-6 text-emerald-800 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-emerald-950 text-xs">
              {selectedFile ? selectedFile.name : 'Click / Tap to Upload New Photo'}
            </span>
            <span className="text-[10px] text-slate-600">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB • Ready to save` : 'Select JPG, PNG or WEBP from gallery/device'}
            </span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading && (
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold bg-amber-100 p-2 rounded border border-amber-300 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
              <span>Uploading original photo to Firebase Storage...</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';

