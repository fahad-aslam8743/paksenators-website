import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import {
  uploadVideoToYouTube,
  updateYouTubeVideoMetadata,
  deleteVideoFromYouTube,
  listChannelVideos,
  isYouTubeConfigured
} from './server/youtube';
import { cert, getApps as getAdminApps, initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import {
  initialSiteSettings,
  initialLeadership,
  initialCommittees,
  initialSenators,
  initialMunMembers,
  initialDistrictChapters,
  initialSessions,
  initialEvents,
  initialNews,
  initialPublications,
  initialGallery,
  initialCertificates,
  initialResolutions,
  initialQuestions,
  initialPolicyRecommendations,
  initialApplications,
  initialVideos,
  initialPages,
  initialMenuItems,
  initialMediaItems,
  initialSystemUsers
} from './src/data/initialData';

const app = express();
const PORT = 3000;

// Simple request logger — prints every incoming request to the terminal so
// it's easy to confirm whether a request from the browser actually reached
// this server.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  if (req.path.startsWith('/api/')) {
    console.log(`[REQ IN]  ${req.method} ${req.originalUrl}`);
  }
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`[REQ OUT] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

app.use(express.json({ limit: '20mb' }));

// ---------------- YOUTUBE VIDEO STORAGE ----------------
// Videos are streamed straight to YouTube, never stored on this server's disk.
const uploadVideoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (['video/mp4', 'video/webm', 'video/ogg'].includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported video format. Please upload MP4 or WebM.'));
    }
  }
});

// ---------------- SECURE ADMIN AUTHENTICATION (Firebase Admin SDK) ----------------
let adminAuth: AdminAuth | null = null;
let adminFirestore: AdminFirestore | null = null;
let adminSdkReady = false;

try {
  if (!getAdminApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initAdminApp({ credential: cert(serviceAccount) });
      adminSdkReady = true;
    } else {
      console.warn(
        '[SECURITY] FIREBASE_SERVICE_ACCOUNT_JSON is not set. Admin-only API routes will be ' +
        'locked (503) until it is configured. See .env.example for setup instructions.'
      );
    }
  } else {
    adminSdkReady = true;
  }

  if (adminSdkReady) {
    adminAuth = getAdminAuth();
    const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID;
    adminFirestore = firestoreDatabaseId ? getAdminFirestore(firestoreDatabaseId) : getAdminFirestore();
    // REST transport instead of gRPC — gRPC's long-lived HTTP/2 streams
    // frequently stall on mobile carrier networks / restrictive proxies
    // (e.g. Termux over mobile data). REST is plain HTTPS request/response,
    // far more reliable there, and it's what our real-time listeners below
    // fall back to reconnecting over as well.
    adminFirestore.settings({ preferRest: true });
  }
} catch (e) {
  adminSdkReady = false;
  console.error('[SECURITY] Firebase Admin SDK failed to initialize:', e);
}

// Routes that must remain reachable by anonymous site visitors even though
// they use POST (public forms / public login).
const PUBLIC_MUTATION_ROUTES: { method: string; pattern: RegExp }[] = [
  { method: 'POST', pattern: /^\/api\/applications$/ },
  { method: 'POST', pattern: /^\/api\/events\/register$/ },
  { method: 'POST', pattern: /^\/api\/publications\/[^/]+\/download$/ },
  { method: 'POST', pattern: /^\/api\/contact$/ },
  { method: 'POST', pattern: /^\/api\/newsletter$/ },
  { method: 'POST', pattern: /^\/api\/auth\/login$/ }
];

function isPublicMutation(method: string, urlPath: string): boolean {
  return PUBLIC_MUTATION_ROUTES.some(r => r.method === method && r.pattern.test(urlPath));
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!adminSdkReady || !adminAuth) {
    return res.status(503).json({
      error: 'Admin authentication is not configured on this server. Set FIREBASE_SERVICE_ACCOUNT_JSON and restart.'
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing admin authentication token.' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.admin !== true) {
      return res.status(403).json({ error: 'This account is not authorized for admin access.' });
    }
    (req as any).adminUser = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired admin session. Please sign in again.' });
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/')) return next();
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (isPublicMutation(req.method, req.path)) return next();
  return requireAdmin(req, res, next);
});

// =====================================================================
// DATA LAYER — Firestore is the ONLY source of truth. There is NO
// server-side CMS database of any kind — no local JSON file, no disk
// cache, nothing. Render (this process) holds only an in-memory,
// read-through cache of whatever Firestore has told it, and that
// in-memory cache exists purely so reads are instant; it is never
// itself a source of truth and it starts completely empty on every
// boot.
//
// A document is deleted from Firestore if and only if an admin
// explicitly calls DELETE on that exact document's ID. Nothing else —
// not a startup routine, not a restart, not an empty cache, not a
// failed read, not a Firestore outage — can ever remove or overwrite a
// Firestore document.
//
// Each collection is backed by a FirestoreStore: a live, real-time
// in-memory cache kept in sync via Firestore's onSnapshot listener.
// Reads are served from that cache once it's LIVE. Writes go straight
// to Firestore as a single-document operation. If the listener loses
// its connection (server restart mid-flight, brief network drop,
// Render waking from sleep, etc.) the store's state flips to
// RECONNECTING and mutations are refused until a fresh snapshot
// arrives — see FirestoreState below. The moment the listener
// reconnects, Firestore's SDK delivers a fresh full snapshot which
// REPLACES the cache outright and flips the store back to LIVE, so
// stale data is never silently editable and never lingers once the
// truth is back.
// =====================================================================

/** Readiness state for a single Firestore-backed collection. */
enum FirestoreState {
  /** No real snapshot has ever been received yet — cache is empty. */
  CONNECTING = 'CONNECTING',
  /** A real snapshot has been received — cache reflects actual Firestore data. */
  LIVE = 'LIVE',
  /** Was LIVE at some point but the listener has since errored/dropped and
   * has not yet delivered a fresh snapshot. Cache still holds the last
   * known-good data (for reads), but mutations are refused. */
  RECONNECTING = 'RECONNECTING'
}

const FIRESTORE_COLLECTIONS = [
  'leadership', 'committees', 'senators', 'munMembers', 'chapters', 'sessions', 'events',
  'registrations', 'news', 'publications', 'gallery', 'certificates',
  'resolutions', 'questions', 'policyRecommendations', 'applications',
  'contactMessages', 'subscribers', 'pages', 'menu', 'media', 'users',
  'galleryCollections',
  // Video METADATA (title/description/status/order/YouTube reference etc.)
  // lives here in Firestore like every other CMS collection. The actual
  // video file always stays on YouTube — nothing about the file itself is
  // stored here or on this server's disk. This collection used to be a
  // local-disk-only JSON file (ysp_videos.json), which meant a Render
  // restart/redeploy on a plan without a persistent disk could silently
  // wipe every video's metadata. Moving it into Firestore removes that
  // single point of failure and gives it the exact same safety guarantees
  // (explicit single-document writes, live listener, no auto-delete) as
  // every other collection.
  'videos'
] as const;
type CollectionName = typeof FIRESTORE_COLLECTIONS[number];

/** Thrown when a mutation is attempted while the collection's Firestore
 * listener has not (yet, or no longer) delivered a live snapshot. Routes
 * catch this specifically and respond 503, per the "never edit stale
 * bootstrap data" requirement. */
class FirestoreNotLiveError extends Error {
  constructor(collectionName: string) {
    super('Database is currently reconnecting. Please try again.');
    this.name = 'FirestoreNotLiveError';
  }
}

class FirestoreStore {
  readonly name: string;
  private cache: Map<string, any> = new Map();
  private state: FirestoreState = FirestoreState.CONNECTING;
  private unsubscribe: (() => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  attach() {
    if (!adminFirestore) return;
    this.unsubscribe = adminFirestore.collection(this.name).onSnapshot(
      (snap) => {
        const next = new Map<string, any>();
        snap.forEach(doc => next.set(doc.id, { id: doc.id, ...doc.data() }));
        // Full replace, not a merge — this is what guarantees that once
        // Firestore is reachable again, stale data is discarded
        // immediately rather than lingering.
        this.cache = next;
        const wasLive = this.state === FirestoreState.LIVE;
        this.state = FirestoreState.LIVE;
        if (!wasLive) {
          console.log(`[Firestore] "${this.name}" live — ${next.size} doc(s).`);
        }
      },
      (err) => {
        console.error(`[Firestore] Listener error on "${this.name}" (reads keep serving last known data; writes are blocked until reconnected):`, err.message || err);
        // Deliberately NOT clearing the cache — a transient error must
        // never make reads return nothing. But mutations ARE blocked
        // from this point (see ensureWritable) until a fresh snapshot
        // arrives and flips this back to LIVE. The SDK retries this
        // listener automatically.
        if (this.state === FirestoreState.LIVE) {
          this.state = FirestoreState.RECONNECTING;
        }
      }
    );
  }

  list(): any[] {
    return Array.from(this.cache.values());
  }

  get(id: string): any | undefined {
    return this.cache.get(String(id));
  }

  has(id: string): boolean {
    return this.cache.has(String(id));
  }

  /** True only once a real Firestore snapshot has been received and the
   * listener has not since dropped. Reads may still be served from cache
   * even when this is false (last-known-good), but mutations must not be. */
  isLive(): boolean {
    return this.state === FirestoreState.LIVE;
  }

  getState(): FirestoreState {
    return this.state;
  }

  /** Every mutation path must call this first. Refuses to touch Firestore
   * (or the cache) unless we are certain the cache reflects real,
   * currently-live Firestore data — never bootstrap/stale/empty data. */
  private ensureWritable() {
    if (!adminSdkReady || !adminFirestore) {
      throw new Error('Firestore is not configured on this server. Set FIREBASE_SERVICE_ACCOUNT_JSON and restart.');
    }
    if (this.state !== FirestoreState.LIVE) {
      throw new FirestoreNotLiveError(this.name);
    }
  }

  /** Explicit single-document create/upsert. Never touches any other document. */
  async create(data: any, idPrefix: string): Promise<any> {
    this.ensureWritable();
    // Date.now() alone is millisecond-resolution — two rapid creates (a
    // double-clicked submit button, a retried request) could collide on
    // the same ID and silently merge into one document instead of
    // creating two. A short random suffix makes that practically
    // impossible while keeping IDs short and readable.
    const id = data.id != null && data.id !== ''
      ? String(data.id)
      : `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { ...data, id };
    await adminFirestore!.collection(this.name).doc(id).set(payload, { merge: true });
    this.cache.set(id, payload);
    return payload;
  }

  /** Explicit single-document PARTIAL update. Sends only the changed
   * fields to Firestore (merge: true) rather than the caller's full,
   * potentially-stale copy of the document, so a client holding an old
   * snapshot can never clobber fields another admin changed in the
   * meantime. Never touches any other document. */
  async update(id: string, patch: any): Promise<any> {
    this.ensureWritable();
    const docId = String(id);
    const fieldPatch = { ...patch, id: docId };
    await adminFirestore!.collection(this.name).doc(docId).set(fieldPatch, { merge: true });
    const merged = { ...(this.cache.get(docId) || { id: docId }), ...fieldPatch };
    this.cache.set(docId, merged);
    return merged;
  }

  /** Atomically increments a single numeric field using a Firestore
   * transaction (not a read-modify-write off the in-memory cache), so
   * concurrent requests (e.g. two people registering for the same event
   * at once) can never lose an update to a race condition. Returns the
   * new value. */
  async increment(id: string, field: string, by: number = 1): Promise<number> {
    this.ensureWritable();
    const docId = String(id);
    const docRef = adminFirestore!.collection(this.name).doc(docId);
    const newValue = await adminFirestore!.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const current = snap.exists ? (Number(snap.data()?.[field]) || 0) : 0;
      const next = current + by;
      tx.set(docRef, { [field]: next, id: docId }, { merge: true });
      return next;
    });
    const merged = { ...(this.cache.get(docId) || { id: docId }), [field]: newValue, id: docId };
    this.cache.set(docId, merged);
    return newValue;
  }

  /** Additive-only create used exclusively by the demo-seeding path (see
   * POST /api/admin/seed-demo). Unlike `create()`, this NEVER merges into
   * or overwrites an existing document — if the exact ID already exists,
   * it is skipped entirely and nothing is written. Uses a Firestore
   * transaction so two concurrent seed requests can't both observe
   * "missing" and then both write/overwrite the same document. Returns
   * the created record, or null if the document already existed and was
   * skipped. Normal application create/update paths are untouched by
   * this method — they continue to use `create()`/`update()` above. */
  async createIfMissing(data: any, idPrefix: string): Promise<any | null> {
    this.ensureWritable();
    const id = data.id != null && data.id !== ''
      ? String(data.id)
      : `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { ...data, id };
    const docRef = adminFirestore!.collection(this.name).doc(id);
    const result = await adminFirestore!.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists) {
        // Document already exists (production data or a prior seed run) —
        // skip completely. Do not merge, do not overwrite, do not touch it.
        return null;
      }
      tx.set(docRef, payload);
      return payload;
    });
    if (result) {
      this.cache.set(id, payload);
    }
    return result;
  }

  /** Explicit single-document delete. This is the ONLY way a document can
   * ever be removed from Firestore in this application — always one
   * specific ID, always triggered by one specific admin action. There is
   * no automatic/bulk/diff-based deletion anywhere in this codebase. */
  async delete(id: string): Promise<void> {
    this.ensureWritable();
    const docId = String(id);
    await adminFirestore!.collection(this.name).doc(docId).delete();
    this.cache.delete(docId);
  }
}

const stores: Record<CollectionName, FirestoreStore> = Object.fromEntries(
  FIRESTORE_COLLECTIONS.map(name => [name, new FirestoreStore(name)])
) as Record<CollectionName, FirestoreStore>;

// Settings lives as a single document, not a collection — handled separately,
// but with the exact same readiness/write-gating rules as every other
// collection above: no write is allowed until a real snapshot has arrived.
//
// IMPORTANT: this cache starts at `null`, never at the hardcoded
// `initialSiteSettings` defaults. Settings behaves exactly like every
// other Firestore-backed collection here: before the first real snapshot
// arrives, reads get `null` (an honest "not loaded yet" — the frontend's
// own local placeholder handles rendering until real data shows up), never
// a value dressed up to look like real production content. Once LIVE, this
// only ever holds what Firestore actually returned; if the listener later
// drops (RECONNECTING), the last real snapshot stays cached — it is never
// reset back to the hardcoded defaults.
let settingsCache: any = null;
let settingsState: FirestoreState = FirestoreState.CONNECTING;

function attachSettingsListener() {
  if (!adminFirestore) return;
  adminFirestore.collection('content').doc('settings').onSnapshot(
    (docSnap) => {
      // Always reflect the latest snapshot, in both directions. If the
      // document exists, the cache holds its real data; if it has been
      // deleted from Firestore, the cache must become `null` rather than
      // continuing to serve whatever was last held in memory. Never fall
      // back to `initialSiteSettings` here — a missing document is not an
      // invitation to seed demo data, just an honest "no settings exist".
      settingsCache = docSnap.exists ? docSnap.data() : null;
      settingsState = FirestoreState.LIVE;
    },
    (err) => {
      console.error('[Firestore] Settings listener error (reads keep serving last known settings; writes are blocked until reconnected):', err.message || err);
      if (settingsState === FirestoreState.LIVE) {
        settingsState = FirestoreState.RECONNECTING;
      }
    }
  );
}

async function updateSettings(patch: any): Promise<any> {
  if (!adminSdkReady || !adminFirestore) {
    throw new Error('Firestore is not configured on this server. Set FIREBASE_SERVICE_ACCOUNT_JSON and restart.');
  }
  if (settingsState !== FirestoreState.LIVE) {
    throw new FirestoreNotLiveError('settings');
  }
  await adminFirestore.collection('content').doc('settings').set(patch, { merge: true });
  settingsCache = { ...settingsCache, ...patch };
  return settingsCache;
}

// NOTE: There is deliberately no automatic seeding of any kind here.
//
// This app used to backfill default/demo content automatically on every
// startup (once when a brand-new project reported zero documents, and
// again for a couple of specific "required" pages). That meant an admin
// deleting a page or record could see it silently reappear after the next
// Render restart/redeploy — which is exactly the kind of surprise
// behavior a production CMS must never exhibit.
//
// Production startup is now READ-ONLY with respect to existing Firestore
// data: nothing runs at boot that can create, update, or delete a
// document. The only ways content is ever written are:
//   1. An admin explicitly using the CMS (goes through the normal CRUD
//      routes below), or
//   2. An admin explicitly calling POST /api/admin/seed-demo (see below),
//      which is a manual, admin-triggered, never-automatic action.

// ---------------- Small helpers ----------------

/** Wraps an async route handler so a thrown/rejected error becomes a clean
 * JSON response instead of crashing the process or hanging the request.
 * A FirestoreNotLiveError (collection not yet hydrated / reconnecting)
 * always maps to 503, per the "never allow mutating stale/bootstrap data"
 * requirement — everything else maps to 500. */
function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((err: any) => {
      console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err?.message || err);
      if (!res.headersSent) {
        const status = err instanceof FirestoreNotLiveError ? 503 : 500;
        res.status(status).json({ error: err?.message || 'Internal server error. Please try again.' });
      }
    });
  };
}

/** Registers the standard GET-all / POST-upsert / PUT / DELETE routes for a
 * simple Firestore-backed collection. Collections with extra business logic
 * (custom defaults, side effects) pass beforeCreate/beforeUpdate hooks;
 * collections with genuinely special routes (senators, applications,
 * videos, etc.) are wired up individually further below instead. */
function registerCrud(opts: {
  path: string;
  store: FirestoreStore;
  idPrefix: string;
  sort?: (a: any, b: any) => number;
  beforeCreate?: (body: any) => any;
  beforeUpdate?: (existing: any, body: any) => any;
  allowPost?: boolean;
  allowPut?: boolean;
  allowDelete?: boolean;
}) {
  const {
    path: p, store, idPrefix, sort, beforeCreate, beforeUpdate,
    allowPost = true, allowPut = true, allowDelete = true
  } = opts;

  app.get(`/api/${p}`, asyncHandler(async (req, res) => {
    let list = store.list();
    if (sort) list = [...list].sort(sort);
    res.json(list);
  }));

  if (allowPost) {
    app.post(`/api/${p}`, asyncHandler(async (req, res) => {
      const existing = req.body?.id ? store.get(req.body.id) : undefined;
      if (existing) {
        const patch = beforeUpdate ? beforeUpdate(existing, req.body) : req.body;
        const updated = await store.update(existing.id, patch);
        return res.json(updated);
      }
      const enriched = beforeCreate ? beforeCreate(req.body || {}) : (req.body || {});
      const created = await store.create(enriched, idPrefix);
      res.json(created);
    }));
  }

  if (allowPut) {
    app.put(`/api/${p}/:id`, asyncHandler(async (req, res) => {
      const existing = store.get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const patch = beforeUpdate ? beforeUpdate(existing, req.body || {}) : (req.body || {});
      const updated = await store.update(req.params.id, patch);
      res.json(updated);
    }));
  }

  if (allowDelete) {
    app.delete(`/api/${p}/:id`, asyncHandler(async (req, res) => {
      await store.delete(req.params.id);
      res.json({ success: true });
    }));
  }
}

// ---------------- API ROUTES ----------------

// Health — also reports live Firestore connectivity so the admin panel /
// monitoring can tell "server up but Firestore still reconnecting" apart
// from "fully healthy".
app.get('/api/health', (req: Request, res: Response) => {
  const liveCollections = FIRESTORE_COLLECTIONS.filter(n => stores[n].isLive()).length;
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    firestoreConfigured: adminSdkReady,
    firestoreLive: liveCollections === FIRESTORE_COLLECTIONS.length && settingsState === FirestoreState.LIVE,
    liveCollections,
    totalCollections: FIRESTORE_COLLECTIONS.length
  });
});

// Stats
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    senatorsCount: stores.senators.list().filter((s: any) => s.status === 'Active').length,
    districtChaptersCount: stores.chapters.list().length,
    standingCommitteesCount: stores.committees.list().length,
    sessionsCount: stores.sessions.list().length,
    eventsCount: stores.events.list().length,
    certificatesCount: stores.certificates.list().length,
    membersApplicationsCount: stores.applications.list().length
  });
});

// Site Settings — returns `null` until the first real Firestore snapshot
// has arrived (see settingsCache above). The frontend keeps its own local
// placeholder on the screen until it sees a real (non-null) response, so
// this never results in fake content being shown as if it were live data.
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(settingsCache);
});

app.post('/api/settings', asyncHandler(async (req, res) => {
  const updated = await updateSettings(req.body || {});
  res.json(updated);
}));

// Leadership
registerCrud({
  path: 'leadership', store: stores.leadership, idPrefix: 'lead',
  sort: (a, b) => (a.order || 0) - (b.order || 0)
});

// Committees
registerCrud({ path: 'committees', store: stores.committees, idPrefix: 'com' });

// Senators
registerCrud({
  path: 'senators', store: stores.senators, idPrefix: 'sen',
  beforeCreate: (body) => ({
    membershipId: body.membershipId || `YSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    ...body
  })
});
app.get('/api/senators/:id', (req: Request, res: Response) => {
  const senator = stores.senators.get(req.params.id)
    || stores.senators.list().find((s: any) => s.membershipId === req.params.id);
  if (!senator) return res.status(404).json({ error: 'Senator not found' });
  const { phonePrivate, ...publicProfile } = senator;
  res.json(publicProfile);
});

// Youth MUN Members
registerCrud({
  path: 'mun-members', store: stores.munMembers, idPrefix: 'mun',
  beforeCreate: (body) => ({
    membershipId: body.membershipId || `MUN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    ...body
  })
});
app.get('/api/mun-members/:id', (req: Request, res: Response) => {
  const member = stores.munMembers.get(req.params.id)
    || stores.munMembers.list().find((m: any) => m.membershipId === req.params.id);
  if (!member) return res.status(404).json({ error: 'MUN member not found' });
  res.json(member);
});

// District Chapters
registerCrud({ path: 'chapters', store: stores.chapters, idPrefix: 'dist' });

// Sessions
registerCrud({ path: 'sessions', store: stores.sessions, idPrefix: 'sess' });

// Events
registerCrud({
  path: 'events', store: stores.events, idPrefix: 'evt',
  beforeCreate: (body) => ({ registeredCount: 0, ...body })
});

app.post('/api/events/register', asyncHandler(async (req, res) => {
  const registrationId = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
  const reg = await stores.registrations.create({
    registrationId,
    registeredAt: new Date().toISOString().split('T')[0],
    status: 'Pending',
    attended: false,
    ...req.body
  }, 'reg');

  const event = stores.events.get(req.body?.eventId);
  if (event) {
    // Atomic increment (Firestore transaction) — never a stale
    // read-modify-write off the in-memory cache, so simultaneous
    // registrations can't clobber each other's count.
    await stores.events.increment(event.id, 'registeredCount', 1);
  }

  res.json({ success: true, registrationId, registration: reg });
}));

app.get('/api/events/registrations', (req: Request, res: Response) => {
  res.json(stores.registrations.list());
});

// News
registerCrud({ path: 'news', store: stores.news, idPrefix: 'news' });

// Publications
registerCrud({
  path: 'publications', store: stores.publications, idPrefix: 'pub',
  beforeCreate: (body) => ({ downloadCount: 0, ...body })
});
app.post('/api/publications/:id/download', asyncHandler(async (req, res) => {
  const pub = stores.publications.get(req.params.id);
  if (!pub) return res.status(404).json({ error: 'Not found' });
  const newCount = await stores.publications.increment(pub.id, 'downloadCount', 1);
  res.json({ downloadCount: newCount });
}));

// Gallery
registerCrud({ path: 'gallery', store: stores.gallery, idPrefix: 'gal' });

// ---------------- CLOUDINARY IMAGE DELETION (signed, server-side only) ----------------
// Cloudinary's delete API requires a signed request (API key + secret +
// timestamp, hashed together) — that secret must never reach the browser,
// since anyone holding it could delete any image in the account. The
// upload itself stays client-side (using the public, unsigned upload
// preset), but deletion has to be proxied through this backend endpoint.
app.delete('/api/upload/image/:publicId(*)', asyncHandler(async (req: Request, res: Response) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary] Deletion skipped — CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET not set in .env. The old image remains in Cloudinary storage (no functional impact, just unused).');
    return res.json({ success: false, skipped: true, reason: 'Cloudinary deletion is not configured on this server.' });
  }

  const publicId = req.params.publicId;
  if (!publicId) {
    return res.status(400).json({ error: 'Missing image public_id.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary's signature is SHA1 of the sorted params (excluding file/
  // api_key/signature itself) + the secret, all as one string.
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const form = new URLSearchParams();
  form.append('public_id', publicId);
  form.append('timestamp', String(timestamp));
  form.append('api_key', apiKey);
  form.append('signature', signature);

  const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });

  const data: any = await cloudinaryRes.json().catch(() => null);
  if (!cloudinaryRes.ok || (data && data.result !== 'ok' && data.result !== 'not found')) {
    console.warn('[Cloudinary] Delete failed:', data);
    return res.status(500).json({ error: 'Failed to delete image from Cloudinary.', details: data });
  }

  res.json({ success: true, result: data?.result });
}));

// Gallery Collections — multi-photo albums (title + description + several
// photos uploaded together), separate from the single-item gallery above.
registerCrud({
  path: 'gallery-collections', store: stores.galleryCollections, idPrefix: 'galcol',
  beforeCreate: (body) => ({ date: body.date || new Date().toISOString().split('T')[0], ...body })
});

// ---------------- Videos (YouTube + local metadata file, unchanged design) ----------------
app.post('/api/upload/video', uploadVideoMiddleware.single('video'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No video file was received.' });
  if (!isYouTubeConfigured()) {
    return res.status(503).json({
      error: 'YouTube upload is not configured on this server. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN in .env.'
    });
  }
  try {
    const title = (req.body?.title as string) || req.file.originalname || 'Untitled Video';
    const description = (req.body?.description as string) || '';
    const result = await uploadVideoToYouTube(req.file.buffer, { title, description });
    res.json({
      downloadUrl: result.embedUrl,
      watchUrl: result.watchUrl,
      storagePath: `youtube:${result.videoId}`,
      youtubeVideoId: result.videoId,
      fileSize: req.file.size
    });
  } catch (err: any) {
    console.error('YouTube upload failed:', err);
    res.status(500).json({ error: err?.message || 'YouTube upload failed.' });
  }
});

app.use('/api/upload/video', (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) return res.status(400).json({ error: err.message || 'Video upload failed.' });
  next();
});

app.delete('/api/upload/video/:storageRef', async (req: Request, res: Response) => {
  const storageRef = decodeURIComponent(req.params.storageRef || '');
  const videoId = storageRef.startsWith('youtube:') ? storageRef.replace('youtube:', '') : storageRef;
  if (!videoId) return res.status(400).json({ error: 'Invalid video reference.' });
  try {
    await deleteVideoFromYouTube(videoId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete YouTube video:', err);
    res.status(500).json({ error: 'Failed to delete video from YouTube.' });
  }
});

app.post('/api/videos/sync-youtube', asyncHandler(async (req: Request, res: Response) => {
  if (!isYouTubeConfigured()) return res.status(503).json({ error: 'YouTube is not configured on this server.' });
  const channelVideos = await listChannelVideos();
  const existingIds = new Set(
    stores.videos.list()
      .map((v: any) => v.storagePath)
      .filter((sp: string) => typeof sp === 'string' && sp.startsWith('youtube:'))
      .map((sp: string) => sp.replace('youtube:', ''))
  );
  let imported = 0;
  // Each newly-found channel video is created as its own explicit
  // document — an import can only ever ADD videos, never remove or
  // overwrite an existing one.
  for (const v of channelVideos) {
    if (existingIds.has(v.videoId)) continue;
    await stores.videos.create({
      title: v.title,
      description: v.description,
      category: 'Parliamentary Sessions',
      videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
      storagePath: `youtube:${v.videoId}`,
      thumbnailUrl: v.thumbnailUrl,
      thumbnailStoragePath: '',
      duration: '',
      uploadedBy: 'YouTube (synced)',
      createdAt: v.publishedAt,
      updatedAt: new Date().toISOString(),
      status: 'published',
      sortOrder: 1,
      isDemo: false
    }, 'vid');
    imported++;
  }
  res.json({ success: true, imported, totalOnChannel: channelVideos.length });
}));

app.get('/api/videos', (req: Request, res: Response) => {
  res.json([...stores.videos.list()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
});

app.get('/api/videos/published', (req: Request, res: Response) => {
  res.json(
    stores.videos.list()
      .filter((v: any) => v.status === 'published')
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
  );
});

app.post('/api/videos', asyncHandler(async (req: Request, res: Response) => {
  const existing = req.body?.id ? stores.videos.get(req.body.id) : undefined;
  const base = {
    title: req.body.title || 'Untitled Video',
    description: req.body.description || '',
    category: req.body.category || 'Parliamentary Sessions',
    videoUrl: req.body.videoUrl || '',
    storagePath: req.body.storagePath || '',
    thumbnailUrl: req.body.thumbnailUrl || '',
    thumbnailStoragePath: req.body.thumbnailStoragePath || '',
    uploadedBy: req.body.uploadedBy || 'Administrator',
    status: req.body.status || 'published',
    sortOrder: typeof req.body.sortOrder === 'number' ? req.body.sortOrder : 1,
    isDemo: req.body.isDemo ?? false,
    updatedAt: new Date().toISOString()
  };
  if (existing) {
    const updated = await stores.videos.update(existing.id, base);
    return res.json(updated);
  }
  const created = await stores.videos.create({ createdAt: new Date().toISOString(), ...base, id: req.body.id }, 'vid');
  res.json(created);
}));

app.put('/api/videos/:id', asyncHandler(async (req: Request, res: Response) => {
  const existing = stores.videos.get(req.params.id);
  const patch = { ...req.body, updatedAt: new Date().toISOString() };
  const saved = existing
    ? await stores.videos.update(req.params.id, patch)
    : await stores.videos.create({ createdAt: new Date().toISOString(), ...patch, id: req.params.id }, 'vid');

  const sp = saved.storagePath;
  if (typeof sp === 'string' && sp.startsWith('youtube:') && (req.body.title || req.body.description)) {
    const videoId = sp.replace('youtube:', '');
    updateYouTubeVideoMetadata(videoId, { title: req.body.title, description: req.body.description })
      .catch(e => console.warn('Failed to sync metadata to YouTube:', e));
  }
  res.json(saved);
}));

app.post('/api/videos/:id/status', asyncHandler(async (req: Request, res: Response) => {
  if (!stores.videos.has(req.params.id)) return res.status(404).json({ error: 'Video not found' });
  const updated = await stores.videos.update(req.params.id, {
    status: req.body.status || 'published',
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, video: updated });
}));

app.delete('/api/videos/:id', asyncHandler(async (req: Request, res: Response) => {
  await stores.videos.delete(req.params.id);
  res.json({ success: true });
}));

// Certificates
registerCrud({
  path: 'certificates', store: stores.certificates, idPrefix: 'cert',
  beforeCreate: (body) => ({
    certificateNumber: body.certificateNumber || `YSP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    isValid: true,
    ...body
  })
});
app.get('/api/certificates/verify/:number', (req: Request, res: Response) => {
  const searchValue = req.params.number.trim().toUpperCase();
  // The certificate's QR code encodes the senator's Membership ID (e.g.
  // "YSP-2026-22528"), not the separately auto-generated certificateNumber
  // (e.g. "YSP-CERT-2026-4821") — the certificate record stores both, so
  // match on either one. Without this, every QR scan failed with
  // "not found" even though the certificate genuinely exists, since it was
  // only ever being checked against the field the QR doesn't encode.
  const found = stores.certificates.list().find((c: any) =>
    (c.certificateNumber || '').trim().toUpperCase() === searchValue ||
    (c.membershipId || '').trim().toUpperCase() === searchValue
  );
  if (found) return res.json({ found: true, certificate: found });

  // Fallback: most senators are inducted through the admin panel's own
  // Approve flow, which creates the Senator record directly and never
  // writes a matching row into the separate `certificates` collection
  // (only the older /api/applications/:id/status auto-approval path does
  // that). That gap meant every one of those senators' real, valid
  // membership IDs came back "not found" here even though their
  // certificate is fully valid and viewable elsewhere in the app. Rather
  // than depend on that side collection staying in sync, verify directly
  // against the Senator record itself — the actual source of truth.
  const senator: any = stores.senators.list().find((s: any) =>
    (s.membershipId || '').trim().toUpperCase() === searchValue
  );
  if (senator) {
    const { phonePrivate, portalPassword, ...publicSenator } = senator;
    return res.json({ found: true, kind: 'senator', senator: publicSenator });
  }

  res.json({ found: false, message: 'Certificate not found or invalid.' });
});

// Applications & Membership
app.get('/api/applications', (req: Request, res: Response) => {
  res.json(stores.applications.list());
});

app.post('/api/applications', asyncHandler(async (req, res) => {
  const created = await stores.applications.create({
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted',
    paymentStatus: req.body?.paymentStatus || 'Pending',
    ...req.body
  }, 'app');
  res.json({ success: true, application: created });
}));

app.put('/api/applications/:id', asyncHandler(async (req, res) => {
  const existing = stores.applications.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found' });
  const updated = await stores.applications.update(req.params.id, req.body || {});
  res.json(updated);
}));

app.post('/api/applications/:id/status', asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body || {};
  const appItem = stores.applications.get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const patch: any = { status };
  if (reviewNotes) patch.reviewNotes = reviewNotes;

  // If approved, automatically create the official Senator record (once).
  if (status === 'Approved' && !appItem.assignedMembershipId) {
    const membershipId = `YSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    patch.assignedMembershipId = membershipId;

    await stores.senators.create({
      membershipId,
      name: appItem.fullName,
      fatherName: appItem.fatherName,
      cnicNumber: appItem.cnicNumber,
      designation: 'Youth Senator',
      district: appItem.district,
      province: appItem.province,
      committeeName: appItem.preferredCommittee,
      photoUrl: appItem.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      joiningDate: new Date().toISOString().split('T')[0],
      validUntil: `${new Date().getFullYear() + 1}-12-31`,
      biography: appItem.whyJoin,
      parliamentaryRole: 'Youth Senator',
      attendancePercentage: 100,
      sessionsAttendedCount: 0,
      eventsAttendedCount: 0,
      certificatesCount: 1,
      status: 'Active',
      email: appItem.email,
      phonePrivate: appItem.phone,
      address: appItem.address,
      isDemo: false
    }, 'sen');

    await stores.certificates.create({
      certificateNumber: `YSP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Membership Certificate',
      recipientName: appItem.fullName,
      membershipId,
      eventNameOrRole: `Youth Senator - District ${appItem.district}`,
      issueDate: new Date().toISOString().split('T')[0],
      issuedBy: 'Youth Senate Secretariat',
      isValid: true,
      isDemo: false
    }, 'cert');
  }

  const updated = await stores.applications.update(req.params.id, patch);
  res.json({ success: true, application: updated });
}));

app.delete('/api/applications/:id', asyncHandler(async (req, res) => {
  await stores.applications.delete(req.params.id);
  res.json({ success: true });
}));

// Resolutions, Questions & Policy Recommendations
registerCrud({
  path: 'resolutions', store: stores.resolutions, idPrefix: 'res',
  beforeCreate: (body) => ({
    resolutionNumber: `YSP-RES-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    ...body
  })
});

registerCrud({
  path: 'questions', store: stores.questions, idPrefix: 'pq',
  beforeCreate: (body) => ({
    questionNumber: `YSP-PQ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    dateSubmitted: new Date().toISOString().split('T')[0],
    status: 'Submitted',
    ...body
  })
});

registerCrud({
  path: 'policy-recommendations', store: stores.policyRecommendations, idPrefix: 'pr',
  allowPost: false, allowPut: false
});

// Contact & Newsletter
app.post('/api/contact', asyncHandler(async (req, res) => {
  await stores.contactMessages.create({
    submittedAt: new Date().toISOString(),
    isRead: false,
    ...req.body
  }, 'msg');
  res.json({ success: true, message: 'Your message has been received. Thank you for contacting Youth Senate of Pakistan.' });
}));

app.get('/api/contact', (req: Request, res: Response) => {
  res.json(stores.contactMessages.list());
});

app.put('/api/contact/:id', asyncHandler(async (req, res) => {
  const existing = stores.contactMessages.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  const updated = await stores.contactMessages.update(req.params.id, req.body || {});
  res.json(updated);
}));

app.delete('/api/contact/:id', asyncHandler(async (req, res) => {
  await stores.contactMessages.delete(req.params.id);
  res.json({ success: true });
}));

app.post('/api/newsletter', asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const alreadySubscribed = stores.subscribers.list().some((s: any) => s.email === email);
  if (!alreadySubscribed) {
    await stores.subscribers.create({ email, subscribedAt: new Date().toISOString(), isActive: true }, 'sub');
  }
  res.json({ success: true, message: 'Subscribed to Youth Senate of Pakistan updates successfully.' });
}));

// Pages Manager
app.get('/api/pages', (req: Request, res: Response) => {
  res.json(stores.pages.list());
});

app.post('/api/pages', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const existing = (body.id && stores.pages.get(body.id))
    || (body.slug && stores.pages.list().find((p: any) => p.slug === body.slug));
  if (existing) {
    const updated = await stores.pages.update(existing.id, { ...body, updatedAt: new Date().toISOString() });
    return res.json(updated);
  }
  const created = await stores.pages.create({ ...body, updatedAt: new Date().toISOString() }, 'page');
  res.json(created);
}));

app.put('/api/pages/:id', asyncHandler(async (req, res) => {
  const existing = stores.pages.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Page not found' });
  const updated = await stores.pages.update(req.params.id, { ...(req.body || {}), updatedAt: new Date().toISOString() });
  res.json(updated);
}));

// Navigation Menu
registerCrud({
  path: 'menu', store: stores.menu, idPrefix: 'm',
  sort: (a, b) => (a.order || 0) - (b.order || 0),
  beforeCreate: (body) => ({ isEnabled: true, ...body })
});

// Media Library
registerCrud({
  path: 'media', store: stores.media, idPrefix: 'med',
  beforeCreate: (body) => ({ uploadedAt: new Date().toISOString(), ...body }),
  allowPut: false
});

// Users & Roles
registerCrud({
  path: 'users', store: stores.users, idPrefix: 'user',
  beforeCreate: (body) => ({ isActive: true, ...body })
});

// Authentication (Senator/Member Portal only — admin auth is Firebase Auth + requireAdmin above)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body || {};
  const senator = stores.senators.list().find(
    (s: any) => s.membershipId?.toLowerCase() === identifier?.toLowerCase() || s.email?.toLowerCase() === identifier?.toLowerCase()
  );
  if (!senator) return res.status(401).json({ error: 'Invalid Membership ID or Email address.' });
  if (senator.portalPassword && senator.portalPassword !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please check the credentials from your welcome email.' });
  }
  res.json({
    success: true,
    user: {
      id: senator.id,
      name: senator.name,
      email: senator.email,
      membershipId: senator.membershipId,
      role: 'Member',
      senatorProfile: senator
    }
  });
});

/**
 * One-time recovery/cleanup: before this app switched to Cloudinary,
 * uploaded photos (passport photo, CNIC front/back, payment screenshot)
 * were embedded directly as raw base64 text inside the application/
 * senator/MUN-member record itself — sometimes hundreds of KB to nearly
 * 1MB per field. That's what made the Membership Admin and MUN Admin
 * pages slow to load: /api/applications was shipping several MB of JSON
 * on every visit, just from old records.
 *
 * This scans applications, senators, and mun-members for any of the known
 * image fields still holding raw base64 data (recognizable by the
 * "data:image" prefix), uploads each one to Cloudinary properly, and
 * replaces the field with the resulting short URL — recovering the actual
 * photo instead of discarding it, and shrinking these records back down
 * to a normal size for good. Records that are already using a Cloudinary
 * URL are left untouched. Safe to run more than once.
 */
const IMAGE_FIELDS_TO_MIGRATE = ['photoUrl', 'passportPhotoUrl', 'cnicFrontUrl', 'cnicBackUrl', 'paymentReceiptUrl'];

async function migrateBase64FieldToCloudinary(base64DataUri: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  try {
    const form = new URLSearchParams();
    form.append('file', base64DataUri);
    form.append('upload_preset', 'ml_default');
    form.append('folder', 'youth-senate/legacy-migrated');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data?.secure_url) return null;
    return data.secure_url as string;
  } catch {
    return null;
  }
}

app.post('/api/admin/migrate-legacy-photos', asyncHandler(async (req, res) => {
  const results: { collection: string; id: string; field: string; status: 'migrated' | 'failed' }[] = [];

  for (const collectionName of ['applications', 'senators', 'munMembers'] as CollectionName[]) {
    const items = stores[collectionName].list();
    for (const item of items) {
      const patch: Record<string, string> = {};
      for (const field of IMAGE_FIELDS_TO_MIGRATE) {
        const value = (item as any)[field];
        if (typeof value === 'string' && value.startsWith('data:image')) {
          const newUrl = await migrateBase64FieldToCloudinary(value);
          if (newUrl) {
            patch[field] = newUrl;
            results.push({ collection: collectionName, id: item.id, field, status: 'migrated' });
          } else {
            results.push({ collection: collectionName, id: item.id, field, status: 'failed' });
          }
        }
      }
      if (Object.keys(patch).length > 0) {
        await stores[collectionName].update(item.id, patch);
      }
    }
  }

  const migratedCount = results.filter(r => r.status === 'migrated').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  res.json({
    success: true,
    migratedCount,
    failedCount,
    details: results,
    message: migratedCount > 0
      ? `Migrated ${migratedCount} legacy photo(s) to Cloudinary. Admin pages should load much faster now.`
      : 'No legacy embedded photos found — nothing to migrate.'
  });
}));

// DEMO Data Management — both explicit, admin-triggered, single-document
// operations only (never a bulk diff/sync).
app.post('/api/admin/clear-demo', asyncHandler(async (req, res) => {
  for (const name of FIRESTORE_COLLECTIONS) {
    const demoItems = stores[name].list().filter((item: any) => item.isDemo);
    for (const item of demoItems) {
      await stores[name].delete(item.id);
    }
  }
  res.json({ success: true, message: 'All DEMO records cleared successfully.' });
}));

/**
 * One-time recovery tool: some approved applications from before this app's
 * Firestore migration have `assignedMembershipId` already set, but the
 * matching record in `senators` was lost (it only ever existed in the old,
 * now-wiped local-disk storage). The normal approval flow skips re-creating
 * a senator whenever `assignedMembershipId` is already present — so those
 * records can never self-heal through the regular approve action.
 *
 * This scans every Approved application, and for each one whose
 * `assignedMembershipId` has no matching entry in `senators`, recreates the
 * senator record from the application's own stored data — using the SAME
 * membership ID, so any certificate or public verification link already
 * issued with that ID keeps working. Existing, already-correct senator
 * records are left completely untouched. Safe to run more than once —
 * anything already fixed is simply skipped on the next run.
 */
app.post('/api/admin/backfill-missing-senators', asyncHandler(async (req, res) => {
  const approvedApps = stores.applications.list().filter((a: any) => a.status === 'Approved' && a.assignedMembershipId);
  const existingMembershipIds = new Set(stores.senators.list().map((s: any) => s.membershipId));

  const recovered: string[] = [];
  for (const appItem of approvedApps) {
    if (existingMembershipIds.has(appItem.assignedMembershipId)) continue;

    await stores.senators.create({
      membershipId: appItem.assignedMembershipId,
      name: appItem.fullName,
      fatherName: appItem.fatherName,
      cnicNumber: appItem.cnicNumber,
      designation: 'Youth Senator',
      district: appItem.district,
      province: appItem.province,
      committeeName: appItem.preferredCommittee,
      photoUrl: appItem.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      joiningDate: (appItem.updatedAt || appItem.appliedDate || new Date().toISOString()).split('T')[0],
      validUntil: `${new Date().getFullYear() + 1}-12-31`,
      biography: appItem.whyJoin,
      parliamentaryRole: 'Youth Senator',
      attendancePercentage: 100,
      sessionsAttendedCount: 0,
      eventsAttendedCount: 0,
      certificatesCount: 1,
      status: 'Active',
      email: appItem.email,
      phonePrivate: appItem.phone,
      address: appItem.address
    }, 'sen');

    recovered.push(appItem.assignedMembershipId);
  }

  res.json({
    success: true,
    recoveredCount: recovered.length,
    recoveredMembershipIds: recovered,
    message: recovered.length > 0
      ? `Recreated ${recovered.length} missing senator record(s).`
      : 'No missing senator records found — everything already matches.'
  });
}));

/**
 * One-time fix: CNIC/Form B, mobile number, address, and committee name
 * weren't all tracked on senator/MUN-member records from the start —
 * they were added incrementally as new features (certificate redesign,
 * WhatsApp-group need, member directory) needed them. This copies
 * whichever of those fields are still missing from each member's original
 * (approved) application into their member record. Safe to run more than
 * once — anything already filled in is left untouched.
 */

/**
 * Read-only diagnostic — run this FIRST if the backfill below doesn't
 * seem to be filling in CNIC/phone/address/committee. Shows exactly why,
 * per senator: whether a matching approved application was even found,
 * and what that application actually has in each field. This turns "it's
 * still empty, please try again" into an actual answer instead of another
 * guess.
 */
app.get('/api/admin/diagnose-senator-data', (req: Request, res: Response) => {
  const approvedApps = stores.applications.list().filter((a: any) => a.status === 'Approved' && a.assignedMembershipId);
  const appsByMembershipId = new Map(approvedApps.map((a: any) => [a.assignedMembershipId, a]));

  const report = stores.senators.list().map((senator: any) => {
    const matchingApp: any = appsByMembershipId.get(senator.membershipId);
    return {
      senatorName: senator.name,
      senatorMembershipId: senator.membershipId,
      currentlyOnSenatorRecord: {
        cnicNumber: senator.cnicNumber || null,
        phonePrivate: senator.phonePrivate || null,
        address: senator.address || null,
        committeeName: senator.committeeName || null
      },
      matchingApplicationFound: !!matchingApp,
      applicationHasData: matchingApp ? {
        cnicNumber: matchingApp.cnicNumber || null,
        phone: matchingApp.phone || null,
        address: matchingApp.address || null,
        preferredCommittee: matchingApp.preferredCommittee || null
      } : null
    };
  });

  res.json({ totalSenators: report.length, report });
});

app.post('/api/admin/backfill-senator-cnic', asyncHandler(async (req, res) => {
  const approvedApps = stores.applications.list().filter((a: any) => a.status === 'Approved' && a.assignedMembershipId);
  const appsByMembershipId = new Map(approvedApps.map((a: any) => [a.assignedMembershipId, a]));

  let updated = 0;
  for (const senator of stores.senators.list()) {
    const matchingApp: any = appsByMembershipId.get(senator.membershipId);
    if (!matchingApp) continue;

    const patch: Record<string, string> = {};
    if (!senator.cnicNumber && matchingApp.cnicNumber) patch.cnicNumber = matchingApp.cnicNumber;
    if (!senator.phonePrivate && matchingApp.phone) patch.phonePrivate = matchingApp.phone;
    if (!senator.address && matchingApp.address) patch.address = matchingApp.address;
    if (!senator.committeeName && matchingApp.preferredCommittee) patch.committeeName = matchingApp.preferredCommittee;

    if (Object.keys(patch).length > 0) {
      await stores.senators.update(senator.id, patch);
      updated++;
    }
  }

  for (const member of stores.munMembers.list()) {
    const matchingApp: any = appsByMembershipId.get(member.membershipId);
    if (!matchingApp) continue;

    const patch: Record<string, string> = {};
    if (!member.cnicNumber && matchingApp.cnicNumber) patch.cnicNumber = matchingApp.cnicNumber;
    if (!member.phone && matchingApp.phone) patch.phone = matchingApp.phone;
    if (!member.address && matchingApp.address) patch.address = matchingApp.address;
    if (!member.committeeName && matchingApp.preferredCommittee) patch.committeeName = matchingApp.preferredCommittee;

    if (Object.keys(patch).length > 0) {
      await stores.munMembers.update(member.id, patch);
      updated++;
    }
  }

  res.json({
    success: true,
    updatedCount: updated,
    message: updated > 0 ? `Filled in missing details for ${updated} record(s) (senators + MUN members).` : 'Every record already has this data on file.'
  });
}));

app.post('/api/admin/seed-demo', asyncHandler(async (req, res) => {
  // Settings is a singleton document, not an ID-keyed collection, so the
  // "upsert specific bundled IDs, never touch anything else" guarantee
  // below doesn't apply to it the same way — merging the demo defaults
  // onto it would silently overwrite a real admin's site name, tagline,
  // contact info, etc. Only ever seed settings the very first time, when
  // nothing real has been saved there yet; once any real settings exist,
  // this route must never touch that document again.
  if (settingsState === FirestoreState.LIVE && (!settingsCache || Object.keys(settingsCache).length === 0)) {
    await updateSettings(initialSiteSettings);
  }
  const seedMap: Record<CollectionName, { idPrefix: string; items: any[] }> = {
    leadership: { idPrefix: 'lead', items: initialLeadership },
    committees: { idPrefix: 'com', items: initialCommittees },
    senators: { idPrefix: 'sen', items: initialSenators },
    munMembers: { idPrefix: 'mun', items: initialMunMembers },
    chapters: { idPrefix: 'dist', items: initialDistrictChapters },
    sessions: { idPrefix: 'sess', items: initialSessions },
    events: { idPrefix: 'evt', items: initialEvents },
    registrations: { idPrefix: 'reg', items: [] },
    news: { idPrefix: 'news', items: initialNews },
    publications: { idPrefix: 'pub', items: initialPublications },
    gallery: { idPrefix: 'gal', items: initialGallery },
    galleryCollections: { idPrefix: 'galcol', items: [] },
    certificates: { idPrefix: 'cert', items: initialCertificates },
    resolutions: { idPrefix: 'res', items: initialResolutions },
    questions: { idPrefix: 'pq', items: initialQuestions },
    policyRecommendations: { idPrefix: 'pr', items: initialPolicyRecommendations },
    applications: { idPrefix: 'app', items: initialApplications },
    contactMessages: { idPrefix: 'msg', items: [] },
    subscribers: { idPrefix: 'sub', items: [] },
    pages: { idPrefix: 'page', items: initialPages },
    menu: { idPrefix: 'm', items: initialMenuItems },
    media: { idPrefix: 'med', items: initialMediaItems },
    users: { idPrefix: 'user', items: initialSystemUsers },
    videos: { idPrefix: 'vid', items: initialVideos }
  };
  // Strictly additive: for each bundled demo record, create it only if
  // that exact document ID does not already exist. If it exists — whether
  // that's real production data or a record from a previous seed run — it
  // is skipped untouched. Never merges, never overwrites. See
  // `createIfMissing()` above for the race-safe existence check.
  for (const name of FIRESTORE_COLLECTIONS) {
    const { idPrefix, items } = seedMap[name];
    for (const item of items) {
      await stores[name].createIfMissing(item, idPrefix);
    }
  }
  res.json({ success: true, message: 'DEMO dataset seeded successfully.' });
}));

// ---------------- VITE & FRONTEND SERVING ----------------
async function startServer() {
  // Start serving HTTP requests right away — we do not block startup
  // waiting on Firestore. The site stays up even during a Firestore
  // outage; GET routes serve whatever the in-memory cache has (empty
  // until the first snapshot arrives), and mutation routes correctly
  // refuse with 503 until each collection reports LIVE. There is no
  // disk-backed bootstrap data of any kind — Render holds no CMS
  // database, only a live mirror of Firestore in memory.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Youth Senate of Pakistan server running on http://0.0.0.0:${PORT}`);
  });

  // Attach the real-time Firestore listeners. Each one independently
  // flips its collection to LIVE and replaces its cache the moment it
  // connects (or reconnects), so the app self-corrects to live data
  // automatically, with no restart needed. Nothing here writes to
  // Firestore — startup is entirely read-only.
  if (adminSdkReady && adminFirestore) {
    attachSettingsListener();
    for (const name of FIRESTORE_COLLECTIONS) stores[name].attach();
  } else {
    console.warn('[DB] Firebase Admin SDK not configured — the site cannot read or write CMS data until FIREBASE_SERVICE_ACCOUNT_JSON is set.');
  }

  // Background one-way import: every 10 minutes, pull the channel's
  // uploads and create a Firestore doc for anything not already known.
  // This can only ever ADD video-metadata documents — it never updates or
  // deletes an existing one, so it can't clobber edits an admin made in
  // the CMS, and a slow/failed YouTube API call just skips that cycle.
  if (isYouTubeConfigured()) {
    const YOUTUBE_POLL_INTERVAL_MS = 10 * 60 * 1000;
    setInterval(async () => {
      try {
        const channelVideos = await listChannelVideos();
        const existingIds = new Set(
          stores.videos.list()
            .map((v: any) => v.storagePath)
            .filter((sp: string) => typeof sp === 'string' && sp.startsWith('youtube:'))
            .map((sp: string) => sp.replace('youtube:', ''))
        );
        let imported = 0;
        for (const v of channelVideos) {
          if (existingIds.has(v.videoId)) continue;
          await stores.videos.create({
            title: v.title,
            description: v.description,
            category: 'Parliamentary Sessions',
            videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
            storagePath: `youtube:${v.videoId}`,
            thumbnailUrl: v.thumbnailUrl,
            thumbnailStoragePath: '',
            duration: '',
            uploadedBy: 'YouTube (synced)',
            createdAt: v.publishedAt,
            updatedAt: new Date().toISOString(),
            status: 'published',
            sortOrder: 1,
            isDemo: false
          }, 'vid');
          imported++;
        }
        if (imported > 0) {
          console.log(`[YouTube] Background sync imported ${imported} new video(s) from the channel.`);
        }
      } catch (e) {
        console.warn('[YouTube] Background sync failed:', e);
      }
    }, YOUTUBE_POLL_INTERVAL_MS);
  }
}

// Catch anything that slips past asyncHandler / synchronous route bugs so
// the process itself never crashes from a single bad request.
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

startServer();
