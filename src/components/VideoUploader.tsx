import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Upload, Film, AlertCircle, CheckCircle2, Loader2, X, ShieldCheck } from 'lucide-react';
import { uploadVideoToServer, validateVideoFile } from '../lib/firebaseVideo';

export interface VideoUploaderRef {
  uploadVideo: () => Promise<{ downloadUrl: string; storagePath: string; duration?: string } | null>;
  getSelectedFile: () => File | null;
}

interface VideoUploaderProps {
  storageFolder?: string;
  currentVideoUrl?: string;
  currentStoragePath?: string;
  label?: string;
}

export const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(({
  storageFolder = 'youth-senate/videos',
  currentVideoUrl,
  currentStoragePath,
  label = 'Upload Original Video File'
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentVideoUrl || '');
  const [activeStoragePath, setActiveStoragePath] = useState<string>(currentStoragePath || '');

  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedDuration, setDetectedDuration] = useState<string>('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(currentVideoUrl || '');
      setActiveStoragePath(currentStoragePath || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoUrl, currentStoragePath]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid video file selected');
      return;
    }

    setSelectedFile(file);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const seconds = Math.floor(videoRef.current.duration);
      if (!isNaN(seconds) && seconds > 0) {
        const mins = Math.floor(seconds / 60);
        const remSecs = seconds % 60;
        const durStr = `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
        setDetectedDuration(durStr);
      }
    }
  };

  const handleClear = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(currentVideoUrl || '');
    setActiveStoragePath(currentStoragePath || '');
    setUploadProgress(0);
    setErrorMessage('');
    setDetectedDuration('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Uploads the currently-selected file to Firebase Storage. Called by the
   * parent form right before saving — the same pattern used by
   * ImageUploader (select file -> upload happens on Save), so every
   * upload flow in the admin panel behaves identically.
   */
  const uploadVideo = async (): Promise<{ downloadUrl: string; storagePath: string; duration?: string } | null> => {
    if (!selectedFile) {
      if (currentVideoUrl) {
        return { downloadUrl: currentVideoUrl, storagePath: activeStoragePath, duration: detectedDuration };
      }
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const result = await uploadVideoToServer(
        selectedFile,
        (pct) => setUploadProgress(pct)
      );

      setActiveStoragePath(result.storagePath);
      setPreviewUrl(result.downloadUrl);
      setSelectedFile(null);
      setUploading(false);

      return { downloadUrl: result.downloadUrl, storagePath: result.storagePath, duration: detectedDuration };
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setUploading(false);
      const msg = err.message || 'Video upload failed. Please check network connection.';
      setErrorMessage(msg);
      throw new Error(msg);
    }
  };

  useImperativeHandle(ref, () => ({
    uploadVideo,
    getSelectedFile: () => selectedFile
  }));

  return (
    <div className="space-y-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Uploads directly to YouTube
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3 group"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">
              Click or tap to choose video file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports MP4 or WebM up to 500MB — will upload automatically when you save
            </p>
          </div>
          <div className="inline-block bg-slate-800 text-slate-300 text-[11px] font-semibold px-3 py-1 rounded-full border border-slate-700">
            Select Original Video
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 shadow-inner group">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full max-h-72 object-contain mx-auto"
            />
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="absolute top-2 right-2 bg-slate-950/80 hover:bg-red-700 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors border border-slate-700"
              title="Clear / Change Video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedFile && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-0.5 truncate max-w-md">
                <span className="text-amber-400 font-bold block truncate">{selectedFile.name}</span>
                <span className="text-slate-400 font-mono">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'video'} {detectedDuration && `• Duration: ${detectedDuration}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
              >
                Change File
              </button>
            </div>
          )}

          {selectedFile && !uploading && (
            <p className="text-[11px] text-amber-300/90 italic px-1">
              This video will upload automatically when you click Save below.
            </p>
          )}

          {uploading && (
            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-amber-500/30">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading Original Video File...
                </span>
                <span className="text-white font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {!selectedFile && currentVideoUrl && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">Current video file — select a new one above to replace it.</span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
});

VideoUploader.displayName = 'VideoUploader';
