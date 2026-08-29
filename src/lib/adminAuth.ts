import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from './firebase';
import { AdminUser } from '../types/ysp';

/**
 * Resolves a signed-in Firebase user into a verified AdminUser by checking
 * the `admin` custom claim on their ID token. Custom claims can only be set
 * server-side (see server.ts), so this cannot be spoofed by the client.
 * This account is provisioned once and used directly — no per-login
 * Firestore lookup, so signing in / refreshing the session never spends
 * Firestore quota.
 */
async function resolveAdminProfile(user: User): Promise<AdminUser | null> {
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.admin !== true) return null;

  return {
    uid: user.uid,
    name: user.displayName || 'Administrator',
    email: user.email || '',
    role: 'Administrator'
  };
}

/**
 * Signs an administrator in via Firebase Authentication, then verifies the
 * `admin` custom claim before granting access to the panel.
 */
export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  // Force a token refresh right after sign-in so a just-granted claim is
  // guaranteed to be present.
  await cred.user.getIdToken(true);
  const profile = await resolveAdminProfile(cred.user);
  if (!profile) {
    await signOut(auth);
    throw new Error('This account is not authorized for admin panel access.');
  }
  return profile;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase's persisted auth state so the admin session
 * survives page refreshes. Invokes the callback with either a verified
 * AdminUser or null.
 */
export function watchAdminAuthState(callback: (user: AdminUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    const profile = await resolveAdminProfile(fbUser);
    callback(profile);
  });
}
