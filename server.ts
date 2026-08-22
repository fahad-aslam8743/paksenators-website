import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
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
// this server (helpful when debugging a stuck spinner in the admin panel).
// Logs on ARRIVAL (not just completion) so a request that gets stuck
// mid-processing (e.g. a stalled call to Google's servers) still shows up
// instead of silently printing nothing.
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
// Videos are no longer stored on this server's disk at all. Every upload
// from the admin panel is buffered in memory only long enough to stream
// straight to the site's YouTube channel via the YouTube Data API (see
// ./server/youtube.ts), and the response carries back the resulting
// YouTube video ID. Playback on the site uses the standard YouTube embed
// player pointed at that ID — there is no local video file at any point.
const uploadVideoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB, matches client-side validation
  fileFilter: (req, file, cb) => {
    // Match the client-side check: only accept formats that actually play
    // back in browsers (MOV/AVI upload fine but won't play, so reject them
    // here too in case the client check was bypassed).
    if (['video/mp4', 'video/webm', 'video/ogg'].includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported video format. Please upload MP4 or WebM.'));
    }
  }
});

// ---------------- SECURE ADMIN AUTHENTICATION (Firebase Admin SDK) ----------------
// Every mutating (POST/PUT/DELETE) /api route is admin-only by default. The
// client (admin panel) authenticates with Firebase Authentication and
// attaches a fresh ID token to every request (see src/lib/api.ts). Here we
// verify that token server-side and confirm the UID is present in the
// Firestore `admins` collection before allowing the write through. This
// replaces the previous insecure hardcoded-password check entirely.

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
    // Allow targeting a non-default Firestore database via env var, in case
    // a project was set up with a custom database ID instead of "(default)".
    const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID;
    adminFirestore = firestoreDatabaseId ? getAdminFirestore(firestoreDatabaseId) : getAdminFirestore();
    // Force REST transport instead of gRPC. gRPC needs long-lived HTTP/2
    // streams which frequently stall or get silently dropped on mobile
    // carrier networks / restrictive proxies (e.g. Termux over mobile data).
    // Reads can limp through on gRPC but writes (.set()/.update()) hang
    // indefinitely until our own timeout fires. REST uses plain HTTPS
    // request/response, which is far more reliable in that environment.
    adminFirestore.settings({ preferRest: true });
  }
} catch (e) {
  adminSdkReady = false;
  console.error('[SECURITY] Firebase Admin SDK failed to initialize:', e);
}

// Routes that must remain reachable by anonymous site visitors even though
// they use POST (public forms / public login), matched as `METHOD /path`.
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

// Global gate: any mutating request under /api that isn't explicitly public
// must present a valid, authorized admin token carrying the `admin` custom claim.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/')) return next();
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (isPublicMutation(req.method, req.path)) return next();
  return requireAdmin(req, res, next);
});

// Admin account management (invite/list/revoke) and the one-time bootstrap
// flow have been intentionally removed — this deployment runs with a single,
// already-provisioned admin account managed directly in Firebase
// Authentication. requireAdmin() below still verifies that account's token
// on every mutating request exactly as before; only the self-service
// "manage other admins from the panel" feature (and the Firestore `admins` /
// `system/adminMeta` docs it used) is gone.

// Persistent DB File Path (local cache/fallback — Firestore is the source of truth)
const DB_FILE = path.join(process.cwd(), 'ysp_db.json');

// Memory DB Interface
interface YSPDatabase {
  settings: any;
  leadership: any[];
  committees: any[];
  senators: any[];
  munMembers: any[];
  chapters: any[];
  sessions: any[];
  events: any[];
  registrations: any[];
  news: any[];
  publications: any[];
  gallery: any[];
  videos: any[];
  certificates: any[];
  resolutions: any[];
  questions: any[];
  policyRecommendations: any[];
  applications: any[];
  contactMessages: any[];
  subscribers: any[];
  pages: any[];
  menu: any[];
  media: any[];
  users: any[];
}

// Every array-shaped collection above, mapped 1:1 to a Firestore collection
// of the same name. `settings` is stored separately as a single document
// since it isn't a list of records.
const FIRESTORE_ARRAY_COLLECTIONS: (keyof YSPDatabase)[] = [
  'leadership', 'committees', 'senators', 'munMembers', 'chapters', 'sessions', 'events',
  'registrations', 'news', 'publications', 'gallery', 'videos', 'certificates',
  'resolutions', 'questions', 'policyRecommendations', 'applications',
  'contactMessages', 'subscribers', 'pages', 'menu', 'media', 'users'
];
const SETTINGS_DOC_PATH = { collection: 'content', doc: 'settings' };

function loadLocalDefaults(): YSPDatabase {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.leadership) {
        const haroonIdx = parsed.leadership.findIndex((l: any) => l.id === 'lead-02' || l.name === 'Haroon Mateen');
        if (haroonIdx !== -1) {
          parsed.leadership[haroonIdx] = {
            ...parsed.leadership[haroonIdx],
            photoUrl: '/src/assets/images/haroon_mateen_president_1786445857055.jpg',
            phone: '0343-2810025',
            designation: 'President',
            category: 'President',
            biography: 'Haroon Mateen is the President of Youth Senate of Pakistan (بااختیار نوجوان، مضبوط پاکستان). He directs executive council operations, leads youth parliamentary assemblies, and guides provincial chapters across Pakistan.',
            message: 'Youth empowerment, constructive civic debate, and democratic leadership are essential for Pakistan\'s progress and national unity. (بااختیار نوجوان، مضبوط پاکستان)'
          };
        }
      }
      return {
        ...parsed,
        videos: Array.isArray(parsed.videos) ? parsed.videos : initialVideos,
        munMembers: Array.isArray(parsed.munMembers) ? parsed.munMembers : initialMunMembers,
        pages: parsed.pages && parsed.pages.length > 0 ? parsed.pages : initialPages,
        menu: parsed.menu && parsed.menu.length > 0 ? parsed.menu : initialMenuItems,
        media: parsed.media && parsed.media.length > 0 ? parsed.media : initialMediaItems,
        users: parsed.users && parsed.users.length > 0 ? parsed.users : initialSystemUsers
      };
    } catch (e) {
      console.error('Failed to parse ysp_db.json, using defaults', e);
    }
  }

  return {
    settings: initialSiteSettings,
    leadership: initialLeadership,
    committees: initialCommittees,
    senators: initialSenators,
    munMembers: initialMunMembers,
    chapters: initialDistrictChapters,
    sessions: initialSessions,
    events: initialEvents,
    registrations: [],
    news: initialNews,
    publications: initialPublications,
    gallery: initialGallery,
    videos: initialVideos,
    certificates: initialCertificates,
    resolutions: initialResolutions,
    questions: initialQuestions,
    policyRecommendations: initialPolicyRecommendations,
    applications: initialApplications,
    contactMessages: [],
    subscribers: [],
    pages: initialPages,
    menu: initialMenuItems,
    media: initialMediaItems,
    users: initialSystemUsers
  };
}

/**
 * Pushes the full in-memory dataset to Firestore. Uses an upsert-by-id
 * strategy per collection, deleting any Firestore document whose id is no
 * longer present locally, so Firestore always mirrors `db` exactly. Runs as
 * fire-and-forget from `saveDB()` so it never blocks an API response; also
 * used once at startup to seed a brand-new/empty Firestore project from the
 * bundled local dataset.
 */
async function syncDbToFirestore(source: YSPDatabase) {
  if (!adminSdkReady || !adminFirestore) return;
  try {
    await adminFirestore.collection(SETTINGS_DOC_PATH.collection).doc(SETTINGS_DOC_PATH.doc).set(source.settings || {});

    for (const col of FIRESTORE_ARRAY_COLLECTIONS) {
      const arr: any[] = (source as any)[col] || [];
      const colRef = adminFirestore.collection(col);
      const existingSnap = await colRef.get();
      const existingIds = new Set(existingSnap.docs.map(d => d.id));
      const currentIds = new Set(arr.filter(i => i && i.id != null).map(i => String(i.id)));

      const batch = adminFirestore.batch();
      let opCount = 0;
      for (const item of arr) {
        if (!item || item.id == null) continue;
        batch.set(colRef.doc(String(item.id)), item);
        opCount++;
        if (opCount >= 450) { await batch.commit(); opCount = 0; }
      }
      for (const existingId of existingIds) {
        if (!currentIds.has(existingId)) {
          batch.delete(colRef.doc(existingId));
          opCount++;
          if (opCount >= 450) { await batch.commit(); opCount = 0; }
        }
      }
      if (opCount > 0) await batch.commit();
    }
  } catch (e) {
    console.error('[Firestore] Sync failed:', e);
  }
}

/**
 * Loads the working dataset. Firestore is the source of truth whenever it's
 * configured and reachable: if it already has data, that's what loads; if
 * it's empty (a fresh Firebase project), the bundled local dataset is used
 * to seed it once, so this app runs the same way after being pointed at
 * anyone's own Firebase project. Falls back to the local JSON cache /
 * built-in defaults entirely if Firestore isn't configured or is
 * unreachable, so the site never goes down over a Firebase hiccup.
 */
/**
 * Idempotent, forward-compatible seed patcher. Any content that ships in a
 * code update (like new default pages) but was already absent from an
 * existing installation's data gets backfilled here on every startup, so
 * upgrading the code is enough — no manual data migration steps needed.
 * Returns true if anything was added, so the caller knows to persist it.
 */
function ensureRequiredSeedData(database: YSPDatabase): boolean {
  let changed = false;

  const constitutionSeed = initialPages.find(p => p.id === 'constitution');
  if (constitutionSeed && !database.pages.some(p => p.id === 'constitution')) {
    database.pages.push(constitutionSeed);
    changed = true;
    console.log('[DB] Added missing default "Constitution" page.');
  }

  const munPageSeed = initialPages.find(p => p.id === 'mun');
  if (munPageSeed && !database.pages.some(p => p.id === 'mun')) {
    database.pages.push(munPageSeed);
    changed = true;
    console.log('[DB] Added missing default "Youth MUN" page.');
  }

  if (!Array.isArray(database.munMembers)) {
    database.munMembers = [];
    changed = true;
    console.log('[DB] Backfilled missing "munMembers" collection.');
  }

  return changed;
}

async function loadDB(): Promise<YSPDatabase> {
  if (adminSdkReady && adminFirestore) {
    try {
      const settingsSnap = await adminFirestore.collection(SETTINGS_DOC_PATH.collection).doc(SETTINGS_DOC_PATH.doc).get();
      const result: any = {};
      let hasAnyData = settingsSnap.exists;

      for (const col of FIRESTORE_ARRAY_COLLECTIONS) {
        const snap = await adminFirestore.collection(col).get();
        result[col] = snap.docs.map(d => d.data());
        if (snap.docs.length > 0) hasAnyData = true;
      }

      if (hasAnyData) {
        result.settings = settingsSnap.exists ? settingsSnap.data() : initialSiteSettings;
        const patched = ensureRequiredSeedData(result as YSPDatabase);
        console.log('[DB] Loaded content from Firestore — Firestore is the live source of truth.');
        if (patched) {
          await syncDbToFirestore(result as YSPDatabase);
          console.log('[DB] Synced newly-added default content to Firestore.');
        }
        return result as YSPDatabase;
      }

      console.log('[DB] Firestore project is empty. Seeding it from the local dataset...');
      const localDb = loadLocalDefaults();
      await syncDbToFirestore(localDb);
      console.log('[DB] Firestore seeded successfully.');
      return localDb;
    } catch (e) {
      console.error('[DB] Could not reach Firestore, falling back to local file cache:', e);
    }
  } else {
    console.warn('[DB] Firebase Admin SDK not configured — running on the local JSON file only. Set FIREBASE_SERVICE_ACCOUNT_JSON to migrate content into Firestore.');
  }

  const localDb = loadLocalDefaults();
  ensureRequiredSeedData(localDb);
  return localDb;
}

// Populated asynchronously in startServer() before the server starts
// accepting requests — see below.
let db: YSPDatabase = loadLocalDefaults();

// syncDbToFirestore does a full read+write of every collection, which is
// expensive on Firestore's free-tier quota. saveDB() gets called on nearly
// every admin action, so back-to-back edits (e.g. an admin editing several
// fields, or the panel firing a few requests in a row) would each trigger
// their own full resync — burning through the daily read/write quota very
// fast. Debouncing collapses any burst of saveDB() calls within a short
// window into a single Firestore sync once things go quiet.
let firestoreSyncTimer: NodeJS.Timeout | null = null;
const FIRESTORE_SYNC_DEBOUNCE_MS = 4000;

function saveDB() {
  // Fast local cache (also acts as an offline fallback if Firestore is briefly unreachable)
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save ysp_db.json', e);
  }
  // Debounced, fire-and-forget sync to Firestore, the real source of truth
  if (firestoreSyncTimer) clearTimeout(firestoreSyncTimer);
  firestoreSyncTimer = setTimeout(() => {
    firestoreSyncTimer = null;
    syncDbToFirestore(db).catch(e => console.error('[Firestore] Background sync error:', e));
  }, FIRESTORE_SYNC_DEBOUNCE_MS);
}

// ---------------- API ROUTES ----------------

// Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Stats (Dynamic numbers from DB as mandated)
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    senatorsCount: db.senators.filter(s => s.status === 'Active').length,
    districtChaptersCount: db.chapters.length,
    standingCommitteesCount: db.committees.length,
    sessionsCount: db.sessions.length,
    eventsCount: db.events.length,
    certificatesCount: db.certificates.length,
    membersApplicationsCount: db.applications.length
  });
});

// Site Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDB();
  res.json(db.settings);
});

// Leadership
app.get('/api/leadership', (req: Request, res: Response) => {
  res.json(db.leadership.sort((a, b) => a.order - b.order));
});

app.post('/api/leadership', (req: Request, res: Response) => {
  const memberId = req.body.id;
  if (memberId) {
    const idx = db.leadership.findIndex(l => l.id === memberId);
    if (idx !== -1) {
      db.leadership[idx] = { ...db.leadership[idx], ...req.body };
      saveDB();
      return res.json(db.leadership[idx]);
    }
  }
  const item = { id: memberId || `lead-${Date.now()}`, ...req.body };
  db.leadership.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/leadership/:id', (req: Request, res: Response) => {
  const idx = db.leadership.findIndex(l => l.id === req.params.id);
  if (idx !== -1) {
    db.leadership[idx] = { ...db.leadership[idx], ...req.body };
    saveDB();
    res.json(db.leadership[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/leadership/:id', (req: Request, res: Response) => {
  db.leadership = db.leadership.filter(l => l.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Committees
app.get('/api/committees', (req: Request, res: Response) => {
  res.json(db.committees);
});

app.post('/api/committees', (req: Request, res: Response) => {
  const item = { id: `com-${Date.now()}`, ...req.body };
  db.committees.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/committees/:id', (req: Request, res: Response) => {
  const idx = db.committees.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    db.committees[idx] = { ...db.committees[idx], ...req.body };
    saveDB();
    res.json(db.committees[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/committees/:id', (req: Request, res: Response) => {
  db.committees = db.committees.filter(c => c.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Senators
app.get('/api/senators', (req: Request, res: Response) => {
  res.json(db.senators);
});

app.get('/api/senators/:id', (req: Request, res: Response) => {
  const senator = db.senators.find(s => s.id === req.params.id || s.membershipId === req.params.id);
  if (senator) {
    // Strip private fields for public output
    const { phonePrivate, ...publicProfile } = senator;
    res.json(publicProfile);
  } else {
    res.status(404).json({ error: 'Senator not found' });
  }
});

app.post('/api/senators', (req: Request, res: Response) => {
  const membershipId = req.body.membershipId || `YSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const item = { id: `sen-${Date.now()}`, membershipId, ...req.body };
  db.senators.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/senators/:id', (req: Request, res: Response) => {
  const idx = db.senators.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    db.senators[idx] = { ...db.senators[idx], ...req.body };
    saveDB();
    res.json(db.senators[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/senators/:id', (req: Request, res: Response) => {
  db.senators = db.senators.filter(s => s.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Youth MUN Members (mirrors /api/senators)
app.get('/api/mun-members', (req: Request, res: Response) => {
  res.json(db.munMembers);
});

app.get('/api/mun-members/:id', (req: Request, res: Response) => {
  const member = db.munMembers.find(m => m.id === req.params.id || m.membershipId === req.params.id);
  if (member) {
    res.json(member);
  } else {
    res.status(404).json({ error: 'MUN member not found' });
  }
});

app.post('/api/mun-members', (req: Request, res: Response) => {
  const membershipId = req.body.membershipId || `MUN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const item = { id: `mun-${Date.now()}`, membershipId, ...req.body };
  db.munMembers.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/mun-members/:id', (req: Request, res: Response) => {
  const idx = db.munMembers.findIndex(m => m.id === req.params.id);
  if (idx !== -1) {
    db.munMembers[idx] = { ...db.munMembers[idx], ...req.body };
    saveDB();
    res.json(db.munMembers[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/mun-members/:id', (req: Request, res: Response) => {
  db.munMembers = db.munMembers.filter(m => m.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// District Chapters
app.get('/api/chapters', (req: Request, res: Response) => {
  res.json(db.chapters);
});

app.post('/api/chapters', (req: Request, res: Response) => {
  const item = { id: `dist-${Date.now()}`, ...req.body };
  db.chapters.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/chapters/:id', (req: Request, res: Response) => {
  const idx = db.chapters.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    db.chapters[idx] = { ...db.chapters[idx], ...req.body };
    saveDB();
    res.json(db.chapters[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/chapters/:id', (req: Request, res: Response) => {
  db.chapters = db.chapters.filter(c => c.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Sessions
app.get('/api/sessions', (req: Request, res: Response) => {
  res.json(db.sessions);
});

app.post('/api/sessions', (req: Request, res: Response) => {
  const item = { id: `sess-${Date.now()}`, ...req.body };
  db.sessions.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/sessions/:id', (req: Request, res: Response) => {
  const idx = db.sessions.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    db.sessions[idx] = { ...db.sessions[idx], ...req.body };
    saveDB();
    res.json(db.sessions[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  db.sessions = db.sessions.filter(s => s.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Events & Event Registration
app.get('/api/events', (req: Request, res: Response) => {
  res.json(db.events);
});

app.post('/api/events', (req: Request, res: Response) => {
  const item = { id: `evt-${Date.now()}`, registeredCount: 0, ...req.body };
  db.events.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/events/:id', (req: Request, res: Response) => {
  const idx = db.events.findIndex(e => e.id === req.params.id);
  if (idx !== -1) {
    db.events[idx] = { ...db.events[idx], ...req.body };
    saveDB();
    res.json(db.events[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/events/:id', (req: Request, res: Response) => {
  db.events = db.events.filter(e => e.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.post('/api/events/register', (req: Request, res: Response) => {
  const registrationId = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
  const reg = {
    id: `reg-${Date.now()}`,
    registrationId,
    registeredAt: new Date().toISOString().split('T')[0],
    status: 'Pending',
    attended: false,
    ...req.body
  };
  db.registrations.push(reg);

  // Increment event registered count
  const event = db.events.find(e => e.id === req.body.eventId);
  if (event) {
    event.registeredCount = (event.registeredCount || 0) + 1;
  }

  saveDB();
  res.json({ success: true, registrationId, registration: reg });
});

app.get('/api/events/registrations', (req: Request, res: Response) => {
  res.json(db.registrations);
});

// News
app.get('/api/news', (req: Request, res: Response) => {
  res.json(db.news);
});

app.post('/api/news', (req: Request, res: Response) => {
  const item = { id: `news-${Date.now()}`, ...req.body };
  db.news.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/news/:id', (req: Request, res: Response) => {
  const idx = db.news.findIndex(n => n.id === req.params.id);
  if (idx !== -1) {
    db.news[idx] = { ...db.news[idx], ...req.body };
    saveDB();
    res.json(db.news[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/news/:id', (req: Request, res: Response) => {
  db.news = db.news.filter(n => n.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Publications
app.get('/api/publications', (req: Request, res: Response) => {
  res.json(db.publications);
});

app.post('/api/publications', (req: Request, res: Response) => {
  const item = { id: `pub-${Date.now()}`, downloadCount: 0, ...req.body };
  db.publications.push(item);
  saveDB();
  res.json(item);
});

app.post('/api/publications/:id/download', (req: Request, res: Response) => {
  const pub = db.publications.find(p => p.id === req.params.id);
  if (pub) {
    pub.downloadCount = (pub.downloadCount || 0) + 1;
    saveDB();
    res.json({ downloadCount: pub.downloadCount });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.put('/api/publications/:id', (req: Request, res: Response) => {
  const idx = db.publications.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    db.publications[idx] = { ...db.publications[idx], ...req.body };
    saveDB();
    res.json(db.publications[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/publications/:id', (req: Request, res: Response) => {
  db.publications = db.publications.filter(p => p.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Gallery
app.get('/api/gallery', (req: Request, res: Response) => {
  res.json(db.gallery);
});

app.post('/api/gallery', (req: Request, res: Response) => {
  const item = { id: `gal-${Date.now()}`, ...req.body };
  db.gallery.push(item);
  saveDB();
  res.json(item);
});

app.delete('/api/gallery/:id', (req: Request, res: Response) => {
  db.gallery = db.gallery.filter(g => g.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.put('/api/gallery/:id', (req: Request, res: Response) => {
  const idx = db.gallery.findIndex(g => g.id === req.params.id);
  if (idx !== -1) {
    db.gallery[idx] = { ...db.gallery[idx], ...req.body };
    saveDB();
    res.json(db.gallery[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Videos Management & Public Gallery API
// Upload a video file straight through to YouTube (protected by the global
// admin auth gate above). multer buffers the multipart upload in memory,
// then we stream that buffer to the YouTube Data API via a resumable
// upload. The response carries back the YouTube video ID plus ready embed
// and watch URLs — nothing is written to this server's disk.
app.post('/api/upload/video', uploadVideoMiddleware.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file was received.' });
  }
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
      // Prefixed so the client/db can tell this apart from any legacy
      // storage path format and knows to route deletes to YouTube.
      storagePath: `youtube:${result.videoId}`,
      youtubeVideoId: result.videoId,
      fileSize: req.file.size
    });
  } catch (err: any) {
    console.error('YouTube upload failed:', err);
    res.status(500).json({ error: err?.message || 'YouTube upload failed.' });
  }
});

// Handle multer errors (oversized file, wrong type) with a clean JSON response
// instead of an unhandled exception / raw HTML error page.
app.use('/api/upload/video', (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'Video upload failed.' });
  }
  next();
});

// Delete a video from YouTube. storagePath is expected in the form
// "youtube:VIDEO_ID" (URL-encoded in the path segment).
app.delete('/api/upload/video/:storageRef', async (req: Request, res: Response) => {
  const storageRef = decodeURIComponent(req.params.storageRef || '');
  const videoId = storageRef.startsWith('youtube:') ? storageRef.replace('youtube:', '') : storageRef;
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid video reference.' });
  }
  try {
    await deleteVideoFromYouTube(videoId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete YouTube video:', err);
    res.status(500).json({ error: 'Failed to delete video from YouTube.' });
  }
});

// Two-way sync: pulls every video currently on the connected YouTube
// channel and imports any that aren't already in the local video database
// yet (e.g. videos uploaded directly on YouTube, outside this admin panel).
// Existing entries are left untouched. Admin-only (POST, gated above).
app.post('/api/videos/sync-youtube', async (req: Request, res: Response) => {
  if (!isYouTubeConfigured()) {
    return res.status(503).json({ error: 'YouTube is not configured on this server.' });
  }
  try {
    const channelVideos = await listChannelVideos();
    const existingIds = new Set(
      db.videos
        .map(v => v.storagePath)
        .filter((sp: string) => typeof sp === 'string' && sp.startsWith('youtube:'))
        .map((sp: string) => sp.replace('youtube:', ''))
    );

    let imported = 0;
    for (const v of channelVideos) {
      if (existingIds.has(v.videoId)) continue;
      db.videos.push({
        id: `vid-${Date.now()}-${imported}`,
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
      });
      imported++;
    }

    if (imported > 0) saveDB();
    res.json({ success: true, imported, totalOnChannel: channelVideos.length });
  } catch (err: any) {
    console.error('YouTube sync failed:', err);
    res.status(500).json({ error: err?.message || 'YouTube sync failed.' });
  }
});

app.get('/api/videos', (req: Request, res: Response) => {
  res.json(db.videos.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
});

app.get('/api/videos/published', (req: Request, res: Response) => {
  const published = db.videos
    .filter(v => v.status === 'published')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(published);
});

app.post('/api/videos', (req: Request, res: Response) => {
  const videoId = req.body.id || `vid-${Date.now()}`;
  const item = {
    id: videoId,
    title: req.body.title || 'Untitled Video',
    description: req.body.description || '',
    category: req.body.category || 'Parliamentary Sessions',
    videoUrl: req.body.videoUrl || '',
    storagePath: req.body.storagePath || '',
    thumbnailUrl: req.body.thumbnailUrl || '',
    thumbnailStoragePath: req.body.thumbnailStoragePath || '',
    uploadedBy: req.body.uploadedBy || 'Administrator',
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: req.body.status || 'published',
    sortOrder: typeof req.body.sortOrder === 'number' ? req.body.sortOrder : 1,
    isDemo: req.body.isDemo ?? false
  };

  const existingIdx = db.videos.findIndex(v => v.id === videoId);
  if (existingIdx !== -1) {
    db.videos[existingIdx] = { ...db.videos[existingIdx], ...item };
  } else {
    db.videos.push(item);
  }
  saveDB();
  res.json(item);
});

app.put('/api/videos/:id', async (req: Request, res: Response) => {
  const idx = db.videos.findIndex(v => v.id === req.params.id);
  if (idx !== -1) {
    db.videos[idx] = { 
      ...db.videos[idx], 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    saveDB();

    // Keep YouTube's own title/description in sync when this video is
    // YouTube-hosted and either field changed.
    const sp = db.videos[idx].storagePath;
    if (typeof sp === 'string' && sp.startsWith('youtube:') && (req.body.title || req.body.description)) {
      const videoId = sp.replace('youtube:', '');
      updateYouTubeVideoMetadata(videoId, {
        title: req.body.title,
        description: req.body.description
      }).catch(e => console.warn('Failed to sync metadata to YouTube:', e));
    }

    res.json(db.videos[idx]);
  } else {
    const item = {
      id: req.params.id,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.videos.push(item);
    saveDB();
    res.json(item);
  }
});

app.post('/api/videos/:id/status', (req: Request, res: Response) => {
  const idx = db.videos.findIndex(v => v.id === req.params.id);
  if (idx !== -1) {
    db.videos[idx].status = req.body.status || 'published';
    db.videos[idx].updatedAt = new Date().toISOString();
    saveDB();
    res.json({ success: true, video: db.videos[idx] });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

app.delete('/api/videos/:id', (req: Request, res: Response) => {
  db.videos = db.videos.filter(v => v.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Certificates & Verification
app.get('/api/certificates', (req: Request, res: Response) => {
  res.json(db.certificates);
});

app.get('/api/certificates/verify/:number', (req: Request, res: Response) => {
  const certNumber = req.params.number.trim().toUpperCase();
  const cert = db.certificates.find(c => c.certificateNumber.trim().toUpperCase() === certNumber);
  if (cert) {
    res.json({ found: true, certificate: cert });
  } else {
    res.json({ found: false, message: 'Certificate not found or invalid.' });
  }
});

app.post('/api/certificates', (req: Request, res: Response) => {
  const certNumber = req.body.certificateNumber || `YSP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const item = { id: `cert-${Date.now()}`, certificateNumber: certNumber, isValid: true, ...req.body };
  db.certificates.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/certificates/:id', (req: Request, res: Response) => {
  const idx = db.certificates.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    db.certificates[idx] = { ...db.certificates[idx], ...req.body };
    saveDB();
    res.json(db.certificates[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Applications & Membership
app.get('/api/applications', (req: Request, res: Response) => {
  res.json(db.applications);
});

app.post('/api/applications', (req: Request, res: Response) => {
  const appItem = {
    id: `app-${Date.now()}`,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted',
    paymentStatus: req.body.paymentStatus || 'Pending',
    ...req.body
  };
  db.applications.push(appItem);
  saveDB();
  res.json({ success: true, application: appItem });
});

app.put('/api/applications/:id', (req: Request, res: Response) => {
  const idx = db.applications.findIndex(a => a.id === req.params.id);
  if (idx !== -1) {
    db.applications[idx] = { ...db.applications[idx], ...req.body };
    saveDB();
    res.json(db.applications[idx]);
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

app.post('/api/applications/:id/status', (req: Request, res: Response) => {
  const { status, reviewNotes } = req.body;
  const appItem = db.applications.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: 'Application not found' });
  }

  appItem.status = status;
  if (reviewNotes) appItem.reviewNotes = reviewNotes;

  // If approved, automatically create official Senator record if not already created
  if (status === 'Approved' && !appItem.assignedMembershipId) {
    const membershipId = `YSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    appItem.assignedMembershipId = membershipId;

    const newSenator = {
      id: `sen-${Date.now()}`,
      membershipId,
      name: appItem.fullName,
      fatherName: appItem.fatherName,
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
      isDemo: false
    };

    db.senators.push(newSenator);

    // Also auto-generate membership certificate
    db.certificates.push({
      id: `cert-${Date.now()}`,
      certificateNumber: `YSP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Membership Certificate',
      recipientName: appItem.fullName,
      membershipId,
      eventNameOrRole: `Youth Senator - District ${appItem.district}`,
      issueDate: new Date().toISOString().split('T')[0],
      issuedBy: 'Youth Senate Secretariat',
      isValid: true,
      isDemo: false
    });
  }

  saveDB();
  res.json({ success: true, application: appItem });
});

app.delete('/api/applications/:id', (req: Request, res: Response) => {
  db.applications = db.applications.filter(a => a.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.delete('/api/certificates/:id', (req: Request, res: Response) => {
  db.certificates = db.certificates.filter(c => c.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Resolutions, Questions & Policy Recommendations
app.get('/api/resolutions', (req: Request, res: Response) => {
  res.json(db.resolutions);
});

app.post('/api/resolutions', (req: Request, res: Response) => {
  const item = {
    id: `res-${Date.now()}`,
    resolutionNumber: `YSP-RES-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    ...req.body
  };
  db.resolutions.push(item);
  saveDB();
  res.json(item);
});

app.delete('/api/resolutions/:id', (req: Request, res: Response) => {
  db.resolutions = db.resolutions.filter(r => r.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.put('/api/resolutions/:id', (req: Request, res: Response) => {
  const idx = db.resolutions.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    db.resolutions[idx] = { ...db.resolutions[idx], ...req.body };
    saveDB();
    res.json(db.resolutions[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get('/api/questions', (req: Request, res: Response) => {
  res.json(db.questions);
});

app.post('/api/questions', (req: Request, res: Response) => {
  const item = {
    id: `pq-${Date.now()}`,
    questionNumber: `YSP-PQ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    dateSubmitted: new Date().toISOString().split('T')[0],
    status: 'Submitted',
    ...req.body
  };
  db.questions.push(item);
  saveDB();
  res.json(item);
});

app.delete('/api/questions/:id', (req: Request, res: Response) => {
  db.questions = db.questions.filter(q => q.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.put('/api/questions/:id', (req: Request, res: Response) => {
  const idx = db.questions.findIndex(q => q.id === req.params.id);
  if (idx !== -1) {
    db.questions[idx] = { ...db.questions[idx], ...req.body };
    saveDB();
    res.json(db.questions[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get('/api/policy-recommendations', (req: Request, res: Response) => {
  res.json(db.policyRecommendations);
});

app.delete('/api/policy-recommendations/:id', (req: Request, res: Response) => {
  db.policyRecommendations = db.policyRecommendations.filter(p => p.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Contact & Newsletter
app.post('/api/contact', (req: Request, res: Response) => {
  const msg = {
    id: `msg-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    isRead: false,
    ...req.body
  };
  db.contactMessages.push(msg);
  saveDB();
  res.json({ success: true, message: 'Your message has been received. Thank you for contacting Youth Senate of Pakistan.' });
});

app.get('/api/contact', (req: Request, res: Response) => {
  res.json(db.contactMessages);
});

// Pages Manager API
app.get('/api/pages', (req: Request, res: Response) => {
  res.json(db.pages || []);
});

app.post('/api/pages', (req: Request, res: Response) => {
  const item = { id: req.body.id || `page-${Date.now()}`, ...req.body, updatedAt: new Date().toISOString() };
  if (!db.pages) db.pages = [];
  const idx = db.pages.findIndex(p => p.id === item.id || p.slug === item.slug);
  if (idx !== -1) {
    db.pages[idx] = { ...db.pages[idx], ...item };
  } else {
    db.pages.push(item);
  }
  saveDB();
  res.json(item);
});

app.put('/api/pages/:id', (req: Request, res: Response) => {
  if (!db.pages) db.pages = [];
  const idx = db.pages.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    db.pages[idx] = { ...db.pages[idx], ...req.body, updatedAt: new Date().toISOString() };
    saveDB();
    res.json(db.pages[idx]);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

// Navigation Menu API
app.get('/api/menu', (req: Request, res: Response) => {
  res.json((db.menu || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
});

app.post('/api/menu', (req: Request, res: Response) => {
  const item = { id: `m-${Date.now()}`, isEnabled: true, ...req.body };
  if (!db.menu) db.menu = [];
  db.menu.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/menu/:id', (req: Request, res: Response) => {
  if (!db.menu) db.menu = [];
  const idx = db.menu.findIndex(m => m.id === req.params.id);
  if (idx !== -1) {
    db.menu[idx] = { ...db.menu[idx], ...req.body };
    saveDB();
    res.json(db.menu[idx]);
  } else {
    res.status(404).json({ error: 'Menu item not found' });
  }
});

app.delete('/api/menu/:id', (req: Request, res: Response) => {
  if (!db.menu) db.menu = [];
  db.menu = db.menu.filter(m => m.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Media Library API
app.get('/api/media', (req: Request, res: Response) => {
  res.json(db.media || []);
});

app.post('/api/media', (req: Request, res: Response) => {
  const item = { id: `med-${Date.now()}`, uploadedAt: new Date().toISOString(), ...req.body };
  if (!db.media) db.media = [];
  db.media.push(item);
  saveDB();
  res.json(item);
});

app.delete('/api/media/:id', (req: Request, res: Response) => {
  if (!db.media) db.media = [];
  db.media = db.media.filter(m => m.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

// Users & Roles API
app.get('/api/users', (req: Request, res: Response) => {
  res.json(db.users || []);
});

app.post('/api/users', (req: Request, res: Response) => {
  const item = { id: `user-${Date.now()}`, isActive: true, ...req.body };
  if (!db.users) db.users = [];
  db.users.push(item);
  saveDB();
  res.json(item);
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  if (!db.users) db.users = [];
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...req.body };
    saveDB();
    res.json(db.users[idx]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  if (!db.users) db.users = [];
  db.users = db.users.filter(u => u.id !== req.params.id);
  saveDB();
  res.json({ success: true });
});

app.post('/api/newsletter', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!db.subscribers.some(s => s.email === email)) {
    db.subscribers.push({ id: `sub-${Date.now()}`, email, subscribedAt: new Date().toISOString(), isActive: true });
    saveDB();
  }
  res.json({ success: true, message: 'Subscribed to Youth Senate of Pakistan updates successfully.' });
});

// Authentication Login Endpoint (Senator/Member Portal only).
// Admin panel authentication is handled entirely by Firebase Authentication
// on the client (see src/lib/adminAuth.ts) and verified server-side by the
// requireAdmin middleware above — no admin credentials ever live here.
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  // Check Senator/Member Login by Membership ID or Email
  const senator = db.senators.find(
    s => s.membershipId.toLowerCase() === identifier.toLowerCase() || s.email.toLowerCase() === identifier.toLowerCase()
  );

  if (!senator) {
    return res.status(401).json({ error: 'Invalid Membership ID or Email address.' });
  }

  // If a portal password has been set (generated automatically when the
  // application was approved), it must match. Older/legacy senator
  // records without a password set yet remain accessible by ID/email only,
  // for backward compatibility.
  if (senator.portalPassword && senator.portalPassword !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please check the credentials from your welcome email.' });
  }

  return res.json({
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

// DEMO Data Management
app.post('/api/admin/clear-demo', (req: Request, res: Response) => {
  db.leadership = db.leadership.filter(item => !item.isDemo);
  db.committees = db.committees.filter(item => !item.isDemo);
  db.senators = db.senators.filter(item => !item.isDemo);
  db.munMembers = db.munMembers.filter(item => !item.isDemo);
  db.chapters = db.chapters.filter(item => !item.isDemo);
  db.sessions = db.sessions.filter(item => !item.isDemo);
  db.events = db.events.filter(item => !item.isDemo);
  db.news = db.news.filter(item => !item.isDemo);
  db.publications = db.publications.filter(item => !item.isDemo);
  db.gallery = db.gallery.filter(item => !item.isDemo);
  db.videos = db.videos.filter(item => !item.isDemo);
  db.certificates = db.certificates.filter(item => !item.isDemo);
  db.resolutions = db.resolutions.filter(item => !item.isDemo);
  db.questions = db.questions.filter(item => !item.isDemo);
  db.policyRecommendations = db.policyRecommendations.filter(item => !item.isDemo);
  db.applications = db.applications.filter(item => !item.isDemo);
  saveDB();
  res.json({ success: true, message: 'All DEMO records cleared successfully.' });
});

app.post('/api/admin/seed-demo', (req: Request, res: Response) => {
  db = {
    settings: initialSiteSettings,
    leadership: initialLeadership,
    committees: initialCommittees,
    senators: initialSenators,
    munMembers: initialMunMembers,
    chapters: initialDistrictChapters,
    sessions: initialSessions,
    events: initialEvents,
    registrations: [],
    news: initialNews,
    publications: initialPublications,
    gallery: initialGallery,
    videos: initialVideos,
    certificates: initialCertificates,
    resolutions: initialResolutions,
    questions: initialQuestions,
    policyRecommendations: initialPolicyRecommendations,
    applications: initialApplications,
    contactMessages: [],
    subscribers: [],
    pages: initialPages,
    menu: initialMenuItems,
    media: initialMediaItems,
    users: initialSystemUsers
  };
  saveDB();
  res.json({ success: true, message: 'DEMO dataset seeded successfully.' });
});

// ---------------- VITE & FRONTEND SERVING ----------------
async function startServer() {
  // Load the working dataset before accepting any requests — Firestore-first
  // when configured (seeding it automatically on a brand-new project),
  // falling back to the local JSON cache otherwise.
  db = await loadDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Youth Senate of Pakistan server running on http://0.0.0.0:${PORT}`);
  });

  // Background two-way sync: every 10 minutes, pull the channel's uploads
  // and import anything not already known locally, so a video uploaded
  // directly on YouTube (outside this admin panel) shows up on the site
  // automatically without an admin having to click "Sync" manually.
  if (isYouTubeConfigured()) {
    const YOUTUBE_POLL_INTERVAL_MS = 10 * 60 * 1000;
    setInterval(async () => {
      try {
        const channelVideos = await listChannelVideos();
        const existingIds = new Set(
          db.videos
            .map(v => v.storagePath)
            .filter((sp: string) => typeof sp === 'string' && sp.startsWith('youtube:'))
            .map((sp: string) => sp.replace('youtube:', ''))
        );
        let imported = 0;
        for (const v of channelVideos) {
          if (existingIds.has(v.videoId)) continue;
          db.videos.push({
            id: `vid-${Date.now()}-${imported}`,
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
          });
          imported++;
        }
        if (imported > 0) {
          saveDB();
          console.log(`[YouTube] Background sync imported ${imported} new video(s) from the channel.`);
        }
      } catch (e) {
        console.warn('[YouTube] Background sync failed:', e);
      }
    }, YOUTUBE_POLL_INTERVAL_MS);
  }
}

startServer();
