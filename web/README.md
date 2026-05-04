# Hitbox Web

The premium web client for Hitbox. Twin to the Flutter app at `../hb/`, sharing the same Firebase backend (`sonic-beats-x`).

- **Flutter (`../hb/`)** — utility client. NFC tap-to-verify, on-the-go portfolio, account.
- **Web (this project)** — premium client. Marketplace, portfolio, social feed, video, recommendations, scroll-animated brand storytelling. No NFC.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens)
- Firebase JS SDK (Auth, Firestore, Storage, Functions)
- TanStack Query
- Framer Motion · Lucide icons
- React Hook Form + Zod

## Design system: Kinetic Etherealism

Defined in `src/app/globals.css`. Deep indigo surfaces, electric aqua / teal / rose accents, Plus Jakarta Sans, glassmorphism, ambient glow (no drop shadows), tonal layering (no 1px borders). See the `glass`, `glow-primary`, `gradient-text`, and `ambient-backdrop` utility classes.

## Getting started

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment

`.env.local` is already populated with the Firebase web config pulled from the Flutter app's `firebase_options.dart`. Both clients hit the same project (`sonic-beats-x`), so the user you sign up here is the same user you'd sign in as on the Flutter app, and vice versa.

If you ever need to regenerate, copy `.env.example` → `.env.local` and grab values from the Firebase console (Project settings → General → Your apps → Web app).

## Project layout

```
src/
  app/
    page.tsx                    # marketing landing (/)
    layout.tsx                  # root layout (Plus Jakarta Sans + providers)
    globals.css                 # Kinetic Etherealism theme
    (auth)/
      layout.tsx                # auth chrome
      login/page.tsx
      signup/page.tsx
    (app)/
      layout.tsx                # auth-gated app shell + TopNav
      dashboard/page.tsx
      portfolio/page.tsx        # reads collectible_instances by user
      marketplace/page.tsx      # reads active listings
      feed/page.tsx             # placeholder for web-only feed
      trades/page.tsx           # reads trades by participant
  components/
    providers.tsx               # QueryClient + AuthProvider
    nav/top-nav.tsx             # glassmorphism nav bar
    ui/                         # button, glass-card, input, label
  contexts/
    auth-context.tsx            # useAuth() — wraps Firebase Auth
  lib/
    utils.ts                    # cn(), formatCurrency, relativeTime
    firebase/
      client.ts                 # initialized app, auth, db, storage, functions
      collections.ts            # Firestore collection name constants (mirrors hb/lib/models/constants.dart)
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing |
| `/login`, `/signup` | Auth |
| `/dashboard` | Authed home with stat cards |
| `/portfolio` | User's claimed collectible instances |
| `/marketplace` | Active listings, sorted newest first |
| `/feed` | Placeholder for web-only social/video feed |
| `/trades` | User's trades |

## Sharing data with the Flutter app

`src/lib/firebase/collections.ts` is a 1:1 mirror of `hb/lib/models/constants.dart` (`FirestoreCollections`). When a collection is added or renamed, update **both** files. Business logic that needs to run from either client should live in a Cloud Function (`hb/functions/`) rather than being duplicated.

## Deploying Firestore rules + indexes

The web app surfaces collections (`listings`) the Flutter app didn't expose, so the Firestore rules and indexes in `../hb/` were extended to cover them. After pulling those changes, deploy them to the live Firebase project:

```bash
cd ../hb
firebase deploy --only firestore:rules,firestore:indexes
```

You'll see indexes build for a minute or two on the Firebase console before marketplace queries succeed. Until rules are deployed, signed-in users will get `permission-denied` on `/marketplace` and on the `messages` subcollection under `/trades`.

## What's next

- **Feed** — design + data model (posts, videos, likes, comments). New Firestore collections required.
- **Recommendations** — Cloud Function that builds a per-user feed based on holdings, wishlist, and trade history.
- **Video** — decide between Firebase Storage + HTML5 player vs. Mux/Cloudflare Stream for transcoding.
- **Marketing scroll experience** — port the cinematic v3 site (`../Website/index.html`) into this codebase, likely as `/about` or replacing `/`.
- **Stripe** — `@stripe/react-stripe-js` for any web-side checkout flows.
- **shadcn/ui** — already wired (clsx, tailwind-merge, cva). Run `npx shadcn@latest init` if you want to pull in more components.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — run production build
- `npm run lint` — eslint
- `npm run typecheck` — tsc --noEmit
