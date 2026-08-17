# Janice Store Utang Tracker

A mobile-first, admin-only web app for tracking customer debts ("utang") at a small store.
Built with Nuxt 4, TypeScript, Tailwind CSS, and Firebase (Auth + Firestore, free tier).

## Features

- Firebase email/password auth (login, first-time admin setup, password reset)
- Light/dark mode toggle (persisted per device)
- Dashboard: total outstanding utang, active debtor count, breakdown by category, recent activity
  (with full date and time), and a "Quick Add Utang" button that lets you pick any person and add
  an utang without leaving the dashboard
- People: add/edit/soft-delete, search, per-person profile page. Only a full name is required —
  no age, address, phone, or gender fields
- Profile photos and product photos are uploaded directly from the device (no image-hosting link
  needed) — each image is compressed client-side to a small JPEG (tens of KB) and stored straight
  in the Firestore document, so no Firebase Storage bucket is required
- Utang types: **Tinda** (product + quantity, auto-calculated), **Cash** (with optional
  percentage/fixed interest, calculated on-demand — no server cron needed), **GCash**
  (amount + phone number)
- Payments: full or partial, auto-updates outstanding balance, per-utang and per-person history
- All modals keep a local draft of what you've typed — closing one accidentally (backdrop tap, the
  × button) won't clear it; the draft is only cleared once you actually save
- Full JSON backup: export the whole database, and restore from a previously exported file
- **Due dates** on every utang, with color-coded urgency (amber when approaching, red when
  overdue) shown on utang cards, the calendar, and the utang detail page
- **Calendar page** with a month-grid view (dots per day for utangs due that day) and an agenda
  list below showing everything due in the selected day/month
- **Product favorites**: star a product to keep it pinned at the top of the picker in Add Utang
  and on the Products page; the picker there is capped to ~5 visible rows with its own scroll
- Each utang has its own **dedicated detail page** (amount/interest breakdown, due date, items,
  full payment history, actions) instead of an expandable card
- Utang history and dashboard activity are grouped into **Today / Yesterday / [date]** sections
- Icon set is [lucide-vue-next](https://lucide.dev) throughout (line icons, dark-mode friendly)
  instead of emoji
- **Printable PDF export** of a person's full utang history (Janice Store letterhead, customer
  info, itemized table, payment history) — `jspdf` + `jspdf-autotable`, generated entirely
  client-side
- **QR / link sharing**: toggle read-only sharing per person to get a QR code and link
  (`/share/{personId}`) a customer can open to see only their own utang history, enforced by
  Firestore security rules (not just hidden in the UI) — revoke anytime by toggling it off
- PWA-ready (installable on phones; a straightforward base for a later Capacitor wrap)

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (free "Spark" plan is enough).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → start in production mode (any region close to you).
4. **Project settings** → General → "Your apps" → Add app → Web. Copy the config values shown.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the six `NUXT_PUBLIC_FIREBASE_*` values from step 1. Leave `NUXT_PUBLIC_ADMIN_UID` blank for now.

## 3. Install and run

```bash
npm install
npm run dev
```

Open the app, go to **First-time setup** (`/register`), and create your admin account.
The screen will show your **UID** — copy it.

## 4. Lock the app down to your account

1. Paste your UID into `NUXT_PUBLIC_ADMIN_UID` in `.env`.
2. Open `firestore.rules` and replace `PASTE_YOUR_ADMIN_UID_HERE` with the same UID.
3. Deploy the rules (requires the [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at your existing project, keep firestore.rules as-is
   firebase deploy --only firestore:rules
   ```
4. Restart the dev server so the new env var is picked up.

From now on, only your admin account can read or write any data — the rules deny everyone else,
including other Firebase Auth accounts someone might create if `/register` is left reachable. If
you want to be extra safe, remove or hide the `/register` route after setup.

> **QR/link sharing depends on these rules being deployed.** The public `/share/{personId}` page
> only works because `firestore.rules` explicitly allows read access to a person (and only their
> own utangs/payments) when that person's `shareEnabled` field is `true` *and* it's within 24 hours
> of `shareEnabledAt` — checked server-side by Firestore itself, not just hidden in the UI. If you
> skip deploying the rules, share links simply won't load any data (fails closed, not open).
>
> **If you're updating from an earlier version:** links shared before this 24-hour expiry was added
> only had `shareEnabled` set, with no `shareEnabledAt`. The updated rules require both fields, so
> those older links stop working automatically — just open "Share access" for that customer again
> to issue a fresh one.

## 5. Build for production

```bash
npm run build
```

This produces a static/client bundle (the app runs fully client-side — `ssr: false` — since it's
an authenticated, personal admin tool, and it keeps the door open for wrapping it with Capacitor
for an Android build later).

Host the output on Firebase Hosting, Netlify, Vercel, or any static host. If using Firebase
Hosting:

```bash
firebase init hosting   # set public dir to .output/public
npm run build
firebase deploy --only hosting
```

## Data models

| Collection | Fields |
|---|---|
| `people` | `id`, `fullName`, `photoUrl?`, `isFavorite?`, `phoneNumber?`, `gcashName?`, `gcashNumber?`, `address?`, `shareEnabled?`, `shareEnabledAt?`, `isDeleted`, `createdAt`, `updatedAt` |
| `products` | `id`, `name`, `price`, `imageUrl?`, `isFavorite?`, `isDeleted`, `createdAt`, `updatedAt` |
| `utangs` | `id`, `personId`, `type` (`tinda`\|`cash`\|`gcash`), `amount`, `status` (`unpaid`\|`partial`\|`paid`), `amountPaid`, `note?`, `dueDate?`, `createdAt`, `updatedAt`, plus type-specific fields: `items[]` (tinda), `interestType?`/`interestValue?`/`interestFrequency?` (cash or gcash), `gcashNumber?` (gcash) |
| `payments` | `id`, `personId`, `utangId`, `amount`, `note?`, `createdAt` |

Notes on the model:

- **Interest applies to both cash and gcash utangs**, calculated on-demand (not stored/accrued by
  a scheduled job) from `interestType`/`interestValue`/`interestFrequency` and elapsed time since
  creation — keeps everything on the Firestore free tier, no Cloud Functions needed.
- **A person's "Fully Paid" status is derived**, not stored — it's `true` whenever the sum of
  their unpaid/partial utangs' outstanding balances is zero. This avoids the two fields drifting
  out of sync.
- **Soft delete**: people and products are never hard-deleted; `isDeleted` hides them from active
  lists while preserving history on any utang/payment records that reference them.
- **Photos are stored as compressed base64 strings directly on the document** (`photoUrl` /
  `imageUrl`), not in Firebase Storage. Uploads are resized and re-encoded as JPEG in the browser
  (`composables/useImageCompress.ts`) down to roughly 35–45 KB before saving, which comfortably
  fits Firestore's 1 MiB per-document limit and avoids needing a Storage bucket at all.
- **Sharing is enforced by Firestore rules, not just the UI.** A person's `shareEnabled: true`
  flag is checked directly in `firestore.rules` via a `get()` lookup — an unauthenticated visitor
  to `/share/{personId}` can only read that one person's document and the utangs/payments whose
  `personId` matches (see `usePublicShare.ts`, which does scoped one-time queries rather than
  reusing the admin's full-collection listeners). Turning sharing off revokes access immediately,
  with no separate "link expiry" bookkeeping needed.

## Project structure

```
composables/   useAuth, usePeople, useProducts, useUtangs, usePayments, usePublicShare,
               useUtangCalc, useImageCompress, usePdfExport, useDraft, useDarkMode,
               useLightbox, useBackup, useToast
components/    Modal, ConfirmDialog, AddUtangModal, PaymentModal, ShareQrModal, ImageUploader,
               ImageLightbox, SortToggle, ToastHost
pages/         login, register, forgot-password, index (dashboard), people/, products/,
               calendar, utangs/[id], backup, share/[personId]
middleware/    auth.global.ts — redirects based on Firebase auth state (allows /share/* through)
layouts/       default.vue — header + bottom nav; share.vue — minimal public layout, no nav
types/         shared TypeScript interfaces for all collections
firestore.rules
```

## Known limits / things to watch (free tier)

- Firestore free tier allows 50k reads / 20k writes / 20k deletes per day — plenty for a single
  store, but the dashboard and person pages use live listeners (`onSnapshot`), so avoid leaving
  many browser tabs open simultaneously.
- Restoring a backup **overwrites** any existing record with the same ID; it does not delete
  records absent from the backup file.
