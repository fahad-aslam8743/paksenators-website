import { auth } from './firebase';

// ---------------------------------------------------------------------
// Read-through cache for GET requests.
//
// Goal (per product requirement): the site should feel fast, and during a
// backend/Firestore outage it should show the last known data instead of a
// blank screen — but the instant the backend is reachable again, it must
// show the real, current data immediately rather than continuing to serve
// the stale cached copy.
//
// How this achieves both:
//   1. Every successful GET response is written to localStorage.
//   2. Every GET request always tries the network FIRST. Only if the
//      network call fails (offline, timeout, 5xx, server not woken up
//      yet on a cold Render instance) do we fall back to whatever is in
//      localStorage for that endpoint, so the screen shows something
//      real instead of nothing.
//   3. Because step 2 always prefers a live network answer when one is
//      available, the moment the backend/Firestore is reachable again,
//      the very next request (component mount, tab focus, reconnect
//      sweep below) returns fresh data and immediately overwrites the
//      cache — stale data is never deliberately preferred over fresh
//      data.
//   4. On top of that, this module listens for the browser regaining
//      connectivity or the tab coming back into focus and proactively
//      re-fetches every endpoint currently held in cache in the
//      background, so screens that are already mounted (and currently
//      showing a stale/cached snapshot) get corrected without the user
//      having to manually reload.
// ---------------------------------------------------------------------

const CACHE_PREFIX = 'ysp_api_cache:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // stale cache older than this is ignored entirely

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

function cacheKey(endpoint: string): string {
  return `${CACHE_PREFIX}${endpoint}`;
}

function readCache<T>(endpoint: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(endpoint));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (!entry || typeof entry.cachedAt !== 'number') return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(endpoint: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(cacheKey(endpoint), JSON.stringify(entry));
  } catch {
    // Storage full/unavailable (private browsing, quota) — caching is a
    // nice-to-have, never let it break the actual request.
  }
}

/** Every GET endpoint fetched this session, so the reconnect sweep below
 * knows what to refresh. Cleared on full page reload (fine — a reload
 * already gets fresh data for everything on mount). */
const knownGetEndpoints = new Set<string>();

async function rawFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined)
  };

  // Attach a fresh Firebase ID token whenever an admin is signed in, so
  // protected /api mutation routes can verify the request.
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn('Could not attach admin auth token to request:', e);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let res: Response;
  try {
    res = await fetch(`/api${endpoint}`, { ...options, headers, signal: controller.signal });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. Check your network connection and that the server is running.');
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

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    // Mutations always go straight to the network — never served from
    // cache, never silently "succeed" against stale local data.
    return rawFetch<T>(endpoint, options);
  }

  knownGetEndpoints.add(endpoint);

  try {
    const data = await rawFetch<T>(endpoint, options);
    writeCache(endpoint, data);
    return data;
  } catch (err) {
    const cached = readCache<T>(endpoint);
    if (cached !== null) {
      console.warn(`[api] "${endpoint}" is unreachable right now — showing last known data instead of an error.`);
      return cached;
    }
    throw err;
  }
}

/** Reads whatever's cached for an endpoint synchronously, without a network
 * call. Useful for painting a screen instantly on mount while a real
 * fetchApi() call runs alongside it — e.g.:
 *
 *   const [items, setItems] = useState(() => getCached('/senators') ?? []);
 *   useEffect(() => { fetchApi('/senators').then(setItems); }, []);
 */
export function getCached<T>(endpoint: string): T | null {
  return readCache<T>(endpoint);
}

/** Re-fetches every GET endpoint used so far in this session, in the
 * background, whenever the app regains connectivity or the tab comes back
 * into focus. This is what guarantees a screen that's currently showing
 * stale/cached data (because it was fetched during an outage) gets
 * corrected automatically once the backend wakes back up, without the
 * user needing to manually refresh. */
function revalidateAllKnownEndpoints() {
  for (const endpoint of knownGetEndpoints) {
    rawFetch(endpoint)
      .then((data) => {
        writeCache(endpoint, data);
        window.dispatchEvent(new CustomEvent('ysp:api-refreshed', { detail: { endpoint, data } }));
      })
      .catch(() => {
        // Still unreachable — leave the existing cache as-is and try again
        // on the next reconnect/focus event.
      });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', revalidateAllKnownEndpoints);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') revalidateAllKnownEndpoints();
  });

  // Background polling sweep, on top of the online/focus triggers above.
  // Purpose: while an admin is sitting on the dashboard (tab stays visible
  // the whole time), neither 'online' nor 'visibilitychange' ever fires, so
  // a new application submitted by someone else would otherwise only show
  // up after a manual page reload. This periodically re-fetches every GET
  // endpoint already in use this session (e.g. /applications, /senators,
  // /mun-members) in the background and, via the 'ysp:api-refreshed' event
  // dispatched above, lets already-mounted screens pick up new records
  // automatically. Deliberately conservative (30s) and skipped while the
  // tab is hidden/backgrounded so it never wastes requests or battery.
  setInterval(() => {
    if (document.visibilityState === 'visible') revalidateAllKnownEndpoints();
  }, 30000);
}
