# Admin Panel — Setup Guide

Your site now has a fully secured admin panel at **`/admin`**, rebuilt from the
ground up on Firebase Authentication, with all content stored in your
Firestore project. This replaces the old hardcoded password with real,
individually-owned admin accounts.

## Deploying (Render — recommended path)

This app is a custom Express server, not a static site, so it needs a host
that runs Node continuously. [Render](https://render.com) works with zero
code changes:

1. Push this code to a GitHub repo.
2. Render → **New → Web Service** → connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add these **Environment Variables** in Render's dashboard:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — paste your full service account JSON (see below for how to get it)
   - `FIRESTORE_DATABASE_ID` — set to exactly `default`
6. Deploy. You'll get a live link like `yourapp.onrender.com`.

## 1. Get your Firebase service account key

1. [Firebase Console](https://console.firebase.google.com) → your project → ⚙️ **Project Settings** → **Service Accounts** tab
2. Click **Generate new private key** — downloads a JSON file
3. Paste its full contents as the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable (in Render's dashboard for production, or your local `.env` for local testing)

**Never paste this key into a chat, email, or anywhere public — it grants full admin access to your Firebase project.**

## 2. Deploy the security rules

Firestore Console → **Rules** tab → paste the contents of `firestore.rules` from this project → **Publish**.
Do the same for Storage: **Storage → Rules** tab → paste `storage.rules` → **Publish**.
(Storage requires upgrading to Firebase's pay-as-you-go "Blaze" plan — still free under normal usage, just requires a card on file.)

## 3. First-time setup

Since no admin account exists yet, you'll see a **"Create Your Super Admin"**
screen instead of a login form. Fill in your name, email, and a password
(8+ characters) — this creates a real Firebase Authentication account and
immediately signs you in. This screen **permanently disables itself** the
moment the first account is created; visiting `/admin` again always shows the
normal sign-in form after that.

## 5. Adding teammates

Once signed in, go to **Admin Access & Security** in the sidebar. From there
you can issue new admin accounts (with their own name/email/password) or
revoke access instantly — no shared credentials, no plaintext passwords
anywhere in the codebase.

## How the security model works

- **Login**: Firebase Authentication (`signInWithEmailAndPassword`) — passwords
  are hashed and managed entirely by Google's infrastructure, never touched
  by this codebase.
- **Authorization**: a custom claim `admin: true` is attached to a user's
  Firebase ID token. Claims can only be set server-side via the Firebase
  Admin SDK (`/api/admin/bootstrap` and `/api/admin/invite`) — a client can
  never grant itself access.
- **Every mutating API call** (`POST`/`PUT`/`DELETE` under `/api/*`) is
  gated by `requireAdmin` middleware in `server.ts`, which verifies the
  Firebase ID token attached to the request (`src/lib/api.ts` attaches it
  automatically whenever an admin is signed in) and checks for the `admin`
  claim before allowing the write through.
- **Direct Firestore/Storage access** is separately locked down by
  `firestore.rules` / `storage.rules` using the same claim, so the
  protection holds even if a request bypasses the Express server entirely.
- **Sessions persist across refresh** via Firebase's own secure, persisted
  auth state — no more re-logging in every time you reload `/admin`.

## Where the content lives (Firestore migration)

All site content — senators, leadership, events, news, committees,
chapters, sessions, publications, gallery, videos, certificates,
resolutions, questions, policy recommendations, applications, contact
messages, newsletter subscribers, pages, navigation menu, media library,
audit logs, and site settings — now lives in **your Firestore project**,
not just a local file.

How it works, in `server.ts`:

- **On startup**, the server checks Firestore first. If your Firestore
  project already has data, that's what loads — Firestore is the live
  source of truth.
- **If Firestore is empty** (a brand-new project), the server automatically
  seeds it from the bundled local dataset (`ysp_db.json` / built-in
  defaults) on first run, so your existing demo content carries over
  automatically the very first time you start the app against a fresh
  Firebase project.
- **Every write** (create/edit/delete from the admin panel) saves to a
  local JSON cache instantly *and* syncs to Firestore in the background —
  so reads stay fast, and Firestore stays authoritative.
- **If Firestore is ever unreachable** (misconfigured `.env`, network
  hiccup), the site keeps running off the local cache automatically —
  content editing never goes down over a Firebase outage.

This means the app is no longer tied to a single machine's filesystem —
point it at your Firestore project and the content follows.

## Video storage

Video files (Video Gallery uploads) are stored directly on this server's
own disk under `uploads/videos/`, served back as plain static files — a
complete, free alternative to Firebase Storage, which requires the paid
Blaze plan for video. Images continue to use Firebase Storage (works fine
on the free plan for typical photo sizes).

**Important for hosting**: if you deploy to a platform with an ephemeral
filesystem (most free-tier hosts reset local files on every redeploy —
Render's free web service is one example), uploaded videos will be lost on
redeploy unless you attach a persistent disk. Render, Railway, and most
VPS providers offer persistent disk/volume options for exactly this. This
doesn't affect local testing or any host with persistent storage.

## Routing

Every page — including `/admin` — now has a real, bookmarkable URL with
working browser Back/Forward buttons, implemented via a lightweight
pathname-based router in `src/context/YSPContext.tsx`. No routing library
was added; every existing `navigate(view, param)` call across the codebase
continues to work unchanged.
