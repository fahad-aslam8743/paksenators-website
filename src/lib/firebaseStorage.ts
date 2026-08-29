// Firebase Storage is no longer used for images — see the note on
// uploadImageToFirebase below for why this switched to Cloudinary.
import { fetchApi } from './api';


/**
 * Image Validation Rule
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload JPG, PNG, or WEBP images only.'
    };
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'File size is too large. Maximum allowed size is 10MB.'
    };
  }

  return { valid: true };
};

/**
 * Client-side Canvas Image Optimization
 * Resizes large photos to max 1200x1200 while preserving aspect ratio and quality.
 */
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.88): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image content'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to initialize canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Canvas image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload Image to Cloudinary
 * Returns { downloadUrl, storagePath }
 *
 * Switched from Firebase Storage to Cloudinary because, as of Feb 2026,
 * Firebase Storage requires the paid Blaze plan to be enabled at all —
 * and in some countries (including Pakistan), setting up a Google Cloud
 * Billing account requires a one-time prepayment that isn't always
 * accessible. Cloudinary's free tier (25GB/month) needs no card at all,
 * so image uploads keep working with zero cost and zero billing setup.
 *
 * `storagePath` here is the Cloudinary public_id (used later for
 * deletion) rather than a Firebase Storage path — same shape/purpose,
 * different provider under the hood. Every caller of this function is
 * unaffected; the signature and return shape are unchanged.
 */
const CLOUDINARY_CLOUD_NAME = 'lbopautj';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

/** One attempt at the actual Cloudinary upload, with a generous timeout for
 * slow mobile connections (many applicants are uploading a few MB over 3G).
 * Throws on timeout, network failure, or a non-OK response. */
const attemptCloudinaryUpload = async (
  file: File,
  folder: string,
  timeoutMs: number
): Promise<{ downloadUrl: string; storagePath: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const uploadWithTimeout = fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const timeout = new Promise<'TIMEOUT'>((resolve) => {
    setTimeout(() => resolve('TIMEOUT'), timeoutMs);
  });

  let result: Response | 'TIMEOUT';
  try {
    result = await Promise.race([uploadWithTimeout, timeout]);
  } catch (error: any) {
    throw new Error(
      error?.message
        ? `Image upload failed: ${error.message}`
        : 'Image upload failed. Please check your connection and try again.'
    );
  }

  if (result === 'TIMEOUT') {
    throw new Error('Image upload timed out.');
  }

  if (!result.ok) {
    const errBody = await result.json().catch(() => null);
    throw new Error(errBody?.error?.message || 'Image upload failed. Please try again.');
  }

  const data = await result.json();
  return { downloadUrl: data.secure_url as string, storagePath: data.public_id as string };
};

/**
 * Upload Image to Cloudinary — with one automatic retry.
 *
 * Many applicants submit over slow/unstable mobile data (this form is used
 * across Pakistan, often on 3G). A single dropped packet used to mean the
 * whole upload — and therefore the whole application — silently failed and
 * had to be manually retried by the applicant, which is a very plausible
 * explanation for a large gap between "people who tried to apply" and
 * "applications that actually reached Firestore": if any one of the 4
 * required uploads timed out, that applicant's submission never went
 * through and nothing was recorded anywhere to show it was even attempted.
 *
 * Now: the first attempt gets 20 seconds (fails fast on a truly dead
 * connection); if it fails for ANY reason, one automatic retry gets 40
 * seconds before giving up for good. This alone should recover a good
 * portion of transient mobile-network failures without the applicant
 * needing to notice or do anything.
 */
export const uploadImageToFirebase = async (
  file: File,
  folder = 'leadership'
): Promise<{ downloadUrl: string; storagePath: string }> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    return await attemptCloudinaryUpload(file, folder, 20000);
  } catch (firstError: any) {
    console.warn('Image upload attempt 1 failed, retrying once:', firstError?.message);
    try {
      return await attemptCloudinaryUpload(file, folder, 40000);
    } catch (secondError: any) {
      throw new Error(
        secondError?.message === 'Image upload timed out.'
          ? 'Image upload timed out twice. Your internet connection may be too slow or unstable right now — please try again, ideally on WiFi or stronger mobile signal.'
          : (secondError?.message || 'Image upload failed. Please check your connection and try again.')
      );
    }
  }
};

/**
 * Delete Image from Cloudinary
 *
 * Proxied through the backend (DELETE /api/upload/image/:publicId), which
 * signs the request with the Cloudinary API secret — that secret must
 * never be present in client-side code, since anyone holding it could
 * delete any image in the account. `storagePath` here is the Cloudinary
 * public_id returned by uploadImageToFirebase above.
 */
export const deleteImageFromFirebase = async (storagePath: string): Promise<void> => {
  if (!storagePath) return;
  try {
    // storagePath is a Cloudinary public_id and legitimately contains
    // folder slashes (e.g. "youth-senate/leadership/172939_photo") — the
    // backend route captures the full remainder of the path as one param,
    // so slashes are left intact rather than percent-encoded here.
    await fetchApi(`/upload/image/${storagePath}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Could not delete image from Cloudinary:', err);
  }
};

// NOTE: Direct client-side Firestore reads/writes for leadership records
// used to live here. They've been removed — Firestore now has exactly one
// writer (the backend's Admin SDK, via /api/leadership) and exactly one
// reader path for CMS data (the backend API, which itself reads from a
// live, always-fresh in-memory cache). This file now only handles image
// uploads (via Cloudinary), which is unrelated to that data-consistency
// concern.
