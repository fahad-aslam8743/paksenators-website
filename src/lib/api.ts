import { auth } from './firebase';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined)
  };

  // Automatically attach a fresh Firebase ID token whenever an admin is
  // signed in, so protected /api mutation routes on the server can verify
  // the request. Public GET requests and public form submissions are
  // unaffected since the server only requires this header for admin-only
  // mutations (see server.ts requireAdmin middleware).
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn('Could not attach admin auth token to request:', e);
    }
  }

  // Guard against a request hanging forever (e.g. a network/DNS issue) —
  // without this, a broken connection would leave the UI spinning with no
  // feedback at all instead of surfacing a clear, actionable error.
  const controller = new AbortController();
  // 60s: generous enough to cover the server's own retry/backoff logic for
  // admin-provisioning calls on a flaky connection, without ever leaving
  // the UI spinning with truly no feedback.
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let res: Response;
  try {
    res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Request timed out after 25 seconds. Check your network connection and that the server is running.');
    }
    throw new Error(e.message || 'Network request failed.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}
