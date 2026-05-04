# Hitbox — Two-Part Implementation Guide

**Hybrid architecture: Flutter (mobile) + React/Next.js (web), sharing one Firebase backend.**

This guide covers the redesign of the Flutter app around its real strengths (NFC, collection, social feed, push) and the build-out of the React app as the public ecosystem (marketplace, artist pages, drops, premium animations).

---

## Guiding Principles

Before either rebuild, hold these as the north star:

1. **Each client does what it's best at.** Flutter is the *collector's pocket vault*. React is the *public storefront and discovery engine*. Don't duplicate features — divide them.
2. **Firestore is the single source of truth.** Every screen on either platform is just a view onto the same documents. No sync code, no API server.
3. **Kinetic Etherealism stays consistent.** Deep indigo surfaces, lavender / cyan / rose accents, Plus Jakarta Sans, tonal layering, no drop shadows. Both apps export from the same design tokens.
4. **Ship in phases.** Don't rebuild everything before launching. Each phase is shippable on its own.

---

# PART 1 — FLUTTER APP REDESIGN

## Vision

The Flutter app becomes the **personal collector experience**: fast, gesture-driven, NFC-first, social. It is the app a Hitbox user opens daily on their phone — to scan a chip, check on a trade, see what artists they follow are dropping, and feel the pulse of their collection.

It stops trying to be a marketplace browser. The web does that better.

**Target platforms:** Android + iOS only. The Windows desktop build is dropped — Windows users use the React web app at `hitbox.com`.

## Core Pillars (the only things the Flutter app does)

1. **Dashboard** — your personalized home (NEW — this is the landing screen)
2. **Collection** — your vault, your way
3. **Feed** — the social heartbeat
4. **Trades & Notifications** — the inbox of collector life
5. **Profile** — identity, settings, payouts

Scanning lives as a persistent **center FAB** in the bottom nav (always one tap away from any tab) rather than its own tab. That keeps NFC front-and-center without burning a tab slot.

That's it. Five tabs + a scan FAB. Ruthless focus.

## Screen-by-Screen Plan

### 1. Dashboard Tab (Home / Landing)
The first screen on launch — a personalized "today on Hitbox" view tailored to *this* user. It's the screen they open the app to check, the way they'd open a banking app to glance at their balance.

**Sections, top to bottom:**

1. **Greeting header** — "Good evening, Paul" + small avatar tap target (links to Profile). Subtle animated gradient in the background using the user's preset theme colors.

2. **Portfolio summary card** — the hero of the screen. A large, premium-looking card showing:
   - Total estimated portfolio value (sum of last-known prices for owned items)
   - 24h / 7d / 30d delta with a tiny sparkline chart
   - Number of collectibles owned
   - Number of artists collected
   - Tap → opens a full portfolio analytics view

   Built with `fl_chart` for the sparkline, tonal layered surfaces, no drop shadows. Pill radius.

3. **Incoming trades strip** — if there are any pending trade proposals, they show here with high visual priority. Side-by-side collectible thumbnails + proposer avatar + accept/view buttons. Empty state hidden when there are none.

4. **Your collection — recent additions** — a horizontal scroller of the last 6 collectibles the user added. Tap → collectible detail. "View all" link → Collection tab.

5. **Tailored for you** — a recommendations strip powered by a Cloud Function that scores collectibles based on: artists you follow, rarity preferences inferred from your collection, drops similar to ones you've bought, friends' recent acquisitions. Title: "Picks for you." Each card has a "Why?" micro-link that explains the recommendation in one line.

6. **Live drops you might like** — countdown cards for active or upcoming drops from artists you follow or whose style matches your collection. Real-time inventory remaining via Firestore listener.

7. **Activity highlights** — a condensed strip from the feed (3 items): a recent drop, a friend's acquisition, an editorial pick. "Open Feed" link → Feed tab.

**Why dashboard-as-home:** the user's first instinct when opening the app is "what's new for me?" A dashboard answers that in one glance. Scan is still always one tap away via the center FAB.

**Implementation:**
- New screen: `lib/screens/dashboard_screen.dart` replacing the current `home_screen.dart`
- Single `_loadDashboard()` method using `Future.wait` to parallel-fetch:
  - Owned collectibles + portfolio totals (reuse `RosterService` cache)
  - Pending trades (`trades` where `recipientId == currentUserId && status == 'pending'`)
  - Recommendations (callable Cloud Function `getTailoredPicks`)
  - Active drops from followed artists (`drops` where `artistId in followedIds && status == 'active'`)
  - Top 3 feed events (`feedEvents` ordered by `createdAt` desc, limit 3)
- Use `AutomaticKeepAliveClientMixin` so the dashboard doesn't refetch on every tab switch
- Pull-to-refresh re-runs `_loadDashboard()`
- Each section is its own widget (`PortfolioSummaryCard`, `IncomingTradesStrip`, `RecentAdditionsRow`, `TailoredPicksRow`, `LiveDropsRow`, `ActivityHighlightsStrip`) so they can be reordered or hidden based on user state
- Empty states for new users: a friendly onboarding card replaces the portfolio card with "Scan your first collectible" CTA that opens the FAB scan flow
- All images use `HitboxCachedImage` (already implemented) with strict size caps to keep the dashboard loading <40 images total
- Display caps per section: 6 recent additions, 8 tailored picks, 4 live drops, 3 activity items
- Responsive layout: on phones it's a single vertical scroll; the rows scroll horizontally inside

**Cloud Function for recommendations:**
- New callable: `getTailoredPicks(userId)` → returns up to 8 collectible IDs
- Logic v1 (simple): pull collectibles from artists the user follows but hasn't bought from yet, sorted by drop recency
- Logic v2 (later): collaborative filtering on collection overlap with similar users

**Scan FAB:**
- Center bottom-nav FAB with the cyan pulsing aura
- Tap → full-screen modal that opens the NFC reader immediately, with a camera-scan secondary option
- Long-press → quick access to recent scans

### 2. Collection Tab
The user's owned collectibles. Three view modes (grid, list, "shelf" 3D-ish view). Sort by artist, drop, rarity, date acquired. Filter chips at top. Tap a card → detail view with the full provenance history.

**Implementation:**
- Reuse `RosterService` cache pattern for owned items
- New widget: `CollectionShelfView` that uses `Transform` matrix for a slight perspective tilt — feels premium without being heavy
- Long-press → quick actions menu (gift, trade, list for sale → opens web checkout)
- Use `cached_network_image` everywhere (already done)

### 3. Feed Tab (NEW — the social heartbeat)
This is the new pillar. A vertical scrolling feed mixing:

- **Drops** from artists you follow ("Lyra just released *Neon Spirits* — 200 editions")
- **Acquisitions** from people you follow ("Marcus added *Vapor Skull #042* to his collection")
- **Trades** ("Sienna and Ravi swapped *Echo Mask* ↔ *Phantom Crown*")
- **Milestones** ("Lyra's *Static Bloom* is now 90% sold")
- **Editorial** posts from Hitbox curators (highlighted drops, interviews)

Each card is rich: large image, action row (like, comment, save, share to web), and a contextual CTA ("Buy on web", "View collectible", "Follow artist").

**Why this matters:** marketplaces without a social loop feel dead. A feed makes the app sticky, gives artists a reason to drop frequently, and creates FOMO around limited editions.

**Implementation:**
- New Firestore collection: `feedEvents` with fields `{type, actorId, targetId, createdAt, audience}`
- Cloud Function triggers on drops, trades, acquisitions → writes feed events with proper audience targeting (followers only)
- Client query: `where('audience', 'arrayContains', currentUserId).orderBy('createdAt', 'desc').limit(20)` with pagination
- Card widget: `FeedEventCard` with a sealed-class union over event types
- Use `CustomScrollView` with `SliverList` for performance
- Pull-to-refresh + infinite scroll
- Pre-cache images as the user scrolls (use `precacheImage` 3 cards ahead)

**Design notes:**
- Pill-shaped cards, 16px gap, full-bleed images at the top
- Action row uses ghost-style icon buttons with `lavender.withOpacity(0.6)`
- Time stamps in micro-text, top-right ("2h", "yesterday")
- Empty state: a friendly illustration + "Follow some artists to start your feed"

### 4. Trades & Notifications Tab
Combined inbox. Two filter chips at top: "Trades" and "Activity." Trade cards show both collectibles side-by-side with the proposer's avatar and a clear accept/counter/decline action row. Activity items are bid wins, sale notifications, mentions.

**Implementation:**
- New widget: `TradeProposalCard` with side-by-side `HitboxCachedImage` for the two collectibles
- Firestore listener on `trades` where `participants` contains current user
- FCM push notifications already wired — just add new notification types for feed mentions

### 5. Profile Tab
Avatar, banner, bio, follower count, collection count. Tabs for "Owned," "Favorited," "Activity." Settings gear in the corner: theme, notifications, payment methods (link to web), sign-out.

**Implementation:**
- Reuse current profile screen as a base
- Add "Open on Web" button that deep-links to `hitbox.com/u/[username]`
- Theme picker uses the existing `PresetThemeProvider` (14 themes already built)

## Cross-Cutting Improvements

- **Bottom nav:** 5 tabs with custom-painted icons + a center FAB for "Quick Scan." When you tap the FAB it expands the Scan tab into a full-screen modal.
- **Haptics everywhere:** every successful scan, swipe, and trade action triggers `HapticFeedback.lightImpact()` or `mediumImpact`. Mobile-only superpower.
- **Animations:** use `flutter_animate` package for declarative micro-animations. Every screen transition is a `SharedAxisTransition`. Card opens use `Hero` animations.
- **Offline-first:** Firestore offline persistence is already on. Make sure the Collection tab works fully offline (it should — Firestore caches the docs).
- **Drop the desktop build.** Flutter desktop is what's been making this hard. Officially target iOS + Android only. Windows users use the web app.

## Phased Rollout

**Week 1:** New navigation shell, new Scan tab, new bottom nav design.
**Week 2:** Collection tab redesign with shelf view + filter chips.
**Week 3:** Feed tab — Firestore schema, Cloud Functions, basic feed card.
**Week 4:** Feed polish — animations, pull-to-refresh, follow flows.
**Week 5:** Trades inbox redesign, notifications integration.
**Week 6:** Profile redesign, deep linking, final polish, ship.

## What to Delete

Be brave and rip these out — the web does them better:

- The "Browse" tab (artists, trending, drops) — moves to web
- The "Marketplace" tab (buy/sell listings) — moves to web
- Any artist discovery / search — moves to web
- Stripe checkout flows — moves to web
- Admin / curator tools — moves to web

The Flutter app gets *smaller and faster* with this rebuild, not bigger.

---

# PART 2 — REACT WEB APP (THE ECOSYSTEM)

## Vision

`hitbox.com` is the **public face of the entire ecosystem**: the place collectors discover artists, browse drops, watch cinematic collectible reveals, read editorial, and complete purchases. It is also where Google indexes everything, where social shares unfurl into beautiful cards, and where curators run the platform.

This is where Hitbox stops looking like an app and starts looking like a *cultural brand*.

## Tech Stack

- **Next.js 15** (App Router) — SSR for SEO, ISR for artist pages, RSC for fast initial loads
- **TypeScript** — strict mode
- **Tailwind CSS** — styled from shared design tokens
- **shadcn/ui** — component primitives, customized to Kinetic Etherealism
- **Framer Motion** — UI micro-animations and page transitions
- **GSAP + ScrollTrigger** — cinematic scroll-linked sequences
- **React Three Fiber + Drei** — 3D collectible viewers
- **Firebase JS SDK** — same backend as Flutter
- **Stripe Elements** — checkout
- **Vercel** — hosting, edge functions, image optimization
- **MDX** — for editorial content / artist long-form bios

## Site Map

```
hitbox.com/
├── /                          → Home (cinematic hero + featured drops)
├── /browse                    → All collectibles, filterable
├── /artists                   → Artist directory
├── /artists/[slug]            → Artist profile (premium)
├── /drops                     → Active and upcoming drops
├── /drops/[slug]              → Drop landing page (cinematic)
├── /collectibles/[id]         → Collectible detail (3D viewer)
├── /u/[username]              → Public collector profile
├── /feed                      → Logged-in feed (mirror of mobile)
├── /trades                    → Trade inbox
├── /editorial                 → Articles, interviews, drops magazine
├── /editorial/[slug]          → Article page
├── /checkout                  → Stripe checkout
├── /account                   → Settings, payouts, notifications
└── /admin                     → Curator tools (gated)
```

## Page-by-Page Plan

### Home (`/`)
A cinematic hero with a full-bleed video or GSAP scroll sequence — think Apple product page energy. Below the fold:

- "Active drops" — horizontal carousel with countdown timers
- "Featured artists" — large hero cards
- "Latest from the editorial" — magazine layout
- "Recently sold" — live ticker pulled from Firestore in real time

**Animations:** GSAP ScrollTrigger pinning the hero, parallax layers, mouse-follow gradients on featured cards. Framer Motion stagger on card grids.

### Browse (`/browse`)
The marketplace. Filter sidebar (artist, rarity, price, drop, status). Grid of collectible cards with hover states that zoom subtly and reveal a "Quick view" button. Infinite scroll. URL-synced filter state for shareability.

**Performance:** Use `next/image` for all collectible thumbnails. Server-render the first page for SEO. Subsequent pages load via Firestore client SDK with cursor pagination.

### Artist Profile (`/artists/[slug]`) — THE WOW PAGE
This is where you flex. Each artist gets a *bespoke-feeling* page:

- Full-bleed hero with their work animating in
- Bio section with custom typography and pull quotes
- "Collections" — their drops as visual chapters
- "Process" — embedded video / images of their workflow
- Live stats (total sales, editions out in the world, follower count)
- Follow button that hits Firestore
- "Open in app" button that deep-links to the Flutter app

**Animations:** GSAP scroll sequence reveals each section. Three.js / R3F for any 3D elements. Framer Motion for the bio text reveals.

**SEO:** Each artist page is SSG'd with ISR — instant load, indexed by Google. Dynamic Open Graph images via `@vercel/og` so social shares look beautiful.

### Drop Landing Page (`/drops/[slug]`)
The most cinematic page on the site. Built like a film trailer:

- Pre-drop: countdown timer, hero video, artist statement
- Live: real-time inventory remaining, "X just bought edition 47" live notifications via Firestore listener
- Sold-out: archive view with "see all owners" gallery

**Animations:** scroll-linked image sequence (the `animated-website` skill we have is *perfect* for this). Particle effects on countdown completion. Confetti when a user successfully purchases.

### Collectible Detail (`/collectibles/[id]`)
The 3D viewer page. React Three Fiber renders the collectible as a rotatable, zoomable model (or a layered 2D viewer for flat artwork). Below: provenance chain, current owner, edition number, price history chart, "Buy" button → Stripe checkout.

**Animations:** R3F orbit controls, environment lighting presets, optional AR view on mobile browsers via WebXR.

### Editorial (`/editorial`)
A real publication. Articles written in MDX, with custom components for embedded collectible cards, image galleries, pull quotes, video. Magazine-style grid on the index page. This is what sets Hitbox apart from competitors — *actual culture and writing around the work.*

### Account / Admin
Standard but polished. shadcn/ui forms, Stripe-hosted payout management, notification preferences. Admin tools for curators to feature drops, write editorial, moderate.

## Shared Pieces

### Design Tokens Package
```
packages/design-tokens/
├── colors.json
├── spacing.json
├── typography.json
└── build.js     → outputs colors.dart + tailwind.config.js
```

One JSON file, two outputs. Edit once, both apps update.

### Firebase Setup
- Same project as Flutter — no new Firebase project needed
- Add a new "Web App" in the Firebase console to get the JS config
- Create a `lib/firebase.ts` in Next.js that initializes the SDK
- Use `react-firebase-hooks` or write thin custom hooks (`useCollection`, `useDocument`, `useAuth`)
- Auth state syncs automatically — sign in on web, you're signed in on mobile

### Cloud Functions
You already have these (or will). Both apps call the same callable functions:
- `purchaseCollectible`
- `proposeTrade`
- `acceptTrade`
- `mintDrop` (admin only)
- `verifyNfcScan`
- `triggerFeedEvent` (auto-fired by Firestore triggers)

No new backend code per platform.

## Phased Rollout

**Week 1:** Next.js scaffold, Firebase wired, design tokens shared, Tailwind themed, shadcn/ui installed and customized. Deploy a "coming soon" landing to Vercel.

**Week 2:** Browse page + collectible detail page (no 3D yet, just beautiful cards). Real Firestore data flowing.

**Week 3:** Artist profile page template. One artist looking *amazing*. This is the "wow moment" — show it to people and watch them react.

**Week 4:** Drop landing page with cinematic scroll animation (use the `animated-website` skill). Countdown, live inventory, the works.

**Week 5:** Stripe checkout, account page, payouts.

**Week 6:** Editorial system (MDX), home page, polish, SEO meta, OG images, launch `hitbox.com`.

**Week 7+:** 3D viewer (R3F), admin tools, web feed mirror, advanced animations, AR mode.

## What Lives Only on the Web (and not in Flutter)

- Marketplace browsing
- Artist discovery
- Drop landing pages
- Editorial / magazine
- Checkout
- Public collector profiles
- Admin / curator tools
- All SEO-indexed content

## What Lives on Both (synced via Firestore)

- Auth / identity
- Owned collectibles
- Feed events
- Trades inbox
- Notifications
- Follow relationships

## What Lives Only in Flutter (and not on web)

- NFC scanning
- Camera collectible scanner
- Haptic-rich collection browsing
- Push notifications (web has them too via FCM, but mobile is the primary channel)

---

# Combined Roadmap

| Week | Flutter | React |
|------|---------|-------|
| 1    | New nav shell, Scan tab | Next.js scaffold, Firebase wired, design tokens |
| 2    | Collection redesign | Browse + collectible detail |
| 3    | Feed schema + Cloud Functions | Artist profile template (wow page) |
| 4    | Feed UI + animations | Drop landing page (cinematic) |
| 5    | Trades inbox redesign | Stripe checkout + account |
| 6    | Profile + deep links + ship | Editorial + home + launch hitbox.com |
| 7+   | Polish, A/B tests | 3D viewer, admin, web feed mirror |

By week 6 you have **both apps live and integrated**. Mobile users get a focused, fast collector experience. Web users get a premium marketplace and discovery destination. Both share one backend, one design language, one identity.

---

# First Concrete Next Step

When you're ready to start, the very first thing to do is:

1. Create a new folder `apps/web/` in your monorepo (or a sibling repo to `hb/`)
2. Run `npx create-next-app@latest hitbox-web --typescript --tailwind --app`
3. Add a "Web App" in the Firebase console for the existing Hitbox project
4. Install Firebase SDK + shadcn/ui + Framer Motion
5. Copy your design token values into `tailwind.config.js`
6. Build the Browse page first — it's the simplest page that proves the whole pipeline works

Once Browse is rendering real Firestore data with the Kinetic Etherealism look, the rest is momentum.
