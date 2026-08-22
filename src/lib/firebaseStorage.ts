import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { LeadershipMember } from '../types/ysp';

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
 * Upload Image to Firebase Storage
 * Returns { downloadUrl, storagePath }
 */
export const uploadImageToFirebase = async (
  file: File,
  folder = 'leadership'
): Promise<{ downloadUrl: string; storagePath: string }> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${folder}/${timestamp}_${sanitizedFileName}`;

  const fallbackToDataUrl = async (): Promise<{ downloadUrl: string; storagePath: string }> => {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { downloadUrl: rawDataUrl, storagePath: `fallback_${timestamp}` };
  };

  try {
    const storageRef = ref(storage, storagePath);
    const metadata = { contentType: file.type || 'image/jpeg' };

    // Never let a stalled/unresponsive Storage connection spin forever —
    // if Firebase Storage doesn't respond within 25 seconds (commonly
    // because Storage hasn't been provisioned/upgraded to the Blaze plan
    // yet on the connected Firebase project), fall back automatically so
    // the upload still completes instead of hanging indefinitely.
    const uploadWithTimeout = (async () => {
      await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(storageRef);
    })();

    const timeout = new Promise<'TIMEOUT'>((resolve) => {
      setTimeout(() => resolve('TIMEOUT'), 25000);
    });

    const result = await Promise.race([uploadWithTimeout, timeout]);
    if (result === 'TIMEOUT') {
      console.warn('Firebase Storage upload timed out after 25s — falling back to inline storage. This usually means Storage needs to be enabled/upgraded on the Firebase project.');
      return await fallbackToDataUrl();
    }

    return { downloadUrl: result, storagePath };
  } catch (error: any) {
    console.warn('Firebase Storage upload warning/fallback:', error);

    // Provide user-friendly messaging
    if (error.code === 'storage/unauthorized' || error.code === 'storage/canceled') {
      throw new Error('Storage permission denied or canceled. Please check rules.');
    }

    // Fallback: convert original file directly to raw Data URL (zero compression/alteration)
    return await fallbackToDataUrl();
  }
};

/**
 * Delete Image from Firebase Storage
 */
export const deleteImageFromFirebase = async (storagePath: string): Promise<void> => {
  if (!storagePath || storagePath.startsWith('fallback_') || !storagePath.includes('/')) {
    return;
  }
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete old storage file:', err);
  }
};

/**
 * FIRESTORE LEADERSHIP PROFILE CRUD OPERATIONS
 */
const LEADERSHIP_COLLECTION = 'leadership';

export const getLeadershipFromFirestore = async (): Promise<LeadershipMember[]> => {
  try {
    const colRef = collection(db, LEADERSHIP_COLLECTION);
    const q = query(colRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    const list: LeadershipMember[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        designation: data.designation || '',
        category: data.category || 'Executive Member',
        photoUrl: data.photoUrl || '',
        photoStoragePath: data.photoStoragePath || '',
        province: data.province || '',
        district: data.district || '',
        biography: data.biography || '',
        message: data.message || '',
        order: typeof data.order === 'number' ? data.order : 99,
        isActive: data.isActive ?? true,
        isDemo: data.isDemo ?? false,
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });

    return list.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching leadership from Firestore:', error);
    return [];
  }
};

export const saveLeadershipToFirestore = async (
  profile: Partial<LeadershipMember> & { id: string }
): Promise<LeadershipMember> => {
  const docRef = doc(db, LEADERSHIP_COLLECTION, profile.id);
  
  const payload = {
    ...profile,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      return { id: docRef.id, ...updatedSnap.data() } as LeadershipMember;
    }
  } catch (err) {
    console.warn('Firestore write error (fallback active):', err);
  }

  return { id: profile.id, ...payload } as LeadershipMember;
};

export const deleteLeadershipFromFirestore = async (id: string, photoStoragePath?: string): Promise<void> => {
  if (photoStoragePath) {
    await deleteImageFromFirebase(photoStoragePath);
  }
  try {
    const docRef = doc(db, LEADERSHIP_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
};
