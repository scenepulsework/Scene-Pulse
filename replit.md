# ScenePulse

A Surfline-style "live conditions" dashboard for local venues (bars, restaurants, retail, cafes, experiences) across North American markets — crowd scores, wait times, and vibe checks so people know before they go.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/scene-pulse run dev` — run the ScenePulse web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed:scene-pulse` — seed/reseed venues across markets
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite (`artifacts/scene-pulse`), dark neon theme, wouter routing, TanStack Query

## Where things live

- DB schema: `lib/db/src/schema/` (`venuesTable`, `commentsTable`, `liveReportsTable`)
- API routes: `artifacts/api-server/src/routes/` (`venues.ts`, `comments.ts`, `reports.ts`, `markets.ts`, `marketGaps.ts`, `stats.ts`)
- Venue presenter (computes `mapsUrl` dynamically): `artifacts/api-server/src/lib/venuePresenter.ts`
- Seed script: `scripts/src/seedScenePulse.ts`
- Frontend pages: `artifacts/scene-pulse/src/pages/` (`home.tsx`, `venue.tsx`)
- Frontend components: `artifacts/scene-pulse/src/components/` (`scene-map.tsx`, `home-sections.tsx`, `layout.tsx`, `venue-card.tsx`, `venue-filters.tsx`, `venue-reports.tsx`, `venue-comments.tsx`)

## Architecture decisions

- `mapsUrl` is computed server-side per request (not stored in DB) from venue name + address via `toMapsUrl()`.
- Intent filtering (dateNight, noWait, retailDrops, liveMusic, patioEnergy, lateNightFood) happens in JS after the DB fetch (small ~78-row dataset), matching against `bestFor` tags or category/waitTime directly in `venues.ts`.
- Submitting a live report updates the venue's `crowdLevel`/`crowdScore`/`waitTimeMinutes` server-side (`reports.ts`).
- The home page centerpiece is a real interactive Leaflet map (`live-map.tsx`, react-leaflet v5 + CARTO dark tiles, no API key) with crowd-level-colored pins. Clicking a pin (or a "Hottest on the map" row) opens a side panel with live stats and The Wire comments (10s polling) so users can comment in real time without leaving the map. Empty state of the panel hosts the Quick Picks intent shortcuts, which drive the map pins via filters. Tile URL must be `basemaps.cartocdn.com` (the `{s}.basemap.cartocdn.com` subdomain variant fails DNS here).
- `useListVenues` on home uses `placeholderData: (prev) => prev` so search/filter keystrokes never unmount the map or drop the selected pin.
- The old abstract radar "Pulse Layer" tab, static Scene Map overview card (Google embed), and mobile Google Maps iframe were replaced by the Leaflet map (works on mobile too).
- Hero has a warm accent color (`--warm`, orange) reserved for primary CTAs ("Use my location", live-sync pill) layered on top of the app's core cyan/pink neon theme, plus functional geolocation (nearest-market lookup via Haversine distance over all venues) and a manual "Refresh conditions" refetch button.
- Map selection is lifted to Home (`selectedVenueId`) and LiveMap is controlled (`selectedId`/`onSelect`, plus a `dataReady` prop gating the auto-deselect effect so stale placeholder data never wipes a fresh selection). "Show on map" (venue cards, speakeasy cards, search suggestions) widens filters to `{sort}` if the venue is hidden and smooth-scrolls to `#map`.
- Search suggestions dropdown in `venue-filters.tsx` filters a second unfiltered `useListVenues({})` list client-side (name/city, top 6); picking one clears filters and selects the pin. No keyboard navigation yet (mouse/touch only — noted as a follow-up).
- `speakeasy` is a first-class intent (OpenAPI enum + INTENT_TAG_MATCH matches the "Speakeasy" bestFor tag); `speakeasy-section.tsx` renders "The Speakeasy Files" horizontal scroller on home.
- Speakeasies are an easter egg: locked by default, unlocked by typing a secret word in the venue search (regex `speakeas|password|secret|knock|sesame|hidden door`, only while locked), persisted in localStorage `scenepulse.speakeasy.unlocked` via `SpeakeasyProvider` (`components/speakeasy-context.tsx`, mounted inside WouterRouter in App.tsx so the dialog Link gets the base path). First unlock via search pops a reveal Dialog ("You found the door.", testids `speakeasy-reveal-dialog`, `button-enter-files`, `button-keep-quiet`), clears the search, and flips intent to speakeasy. Visiting `/speakeasies` directly unlocks silently. Locked state hides: header/mobile nav + footer Speakeasies links, home scroller, and the Speakeasy quick pick; footer shows a hint line (`speakeasy-hint`) and the search placeholder says "…or whisper the password".
- Seed gotcha: DC entries must use city "Washington DC" (no comma) — a "Washington, DC" variant splits it into a 14th market.

## Product

- Multi-page app (wouter routes): `/` home, `/venue/:id`, `/speakeasies`, `/services`, `/markets`, `/operators`, `/about`, `/careers`, `/contact`. Header (desktop + mobile sheet) and footer use wouter `Link`s with active-state highlighting (`text-primary` when `location === href`); nav testids `link-nav-{label}` / `link-mobile-nav-{label}`. A `ScrollToTop` component in App.tsx forces `behavior: "instant"` scroll on route change (html has smooth-scroll CSS that would otherwise animate it).
- Home dashboard is now slim: hero → Live Pulse map (filters, quick picks, paginated venue feed) → Speakeasy Files scroller (with "See all" → `/speakeasies`) → back-to-top. Services/Markets/Operators/About/Contact sections moved to their own pages (section components still live in `home-sections.tsx`, imported by the pages).
- Hero is condensed: primary warm CTA "Explore the live map" (smooth-scrolls to `#map`), outline "Use my location", icon-only ghost refresh (aria-label "Refresh conditions"); right column = 2 highlight cards (Hottest scene / Best easy walk-in) + a compact 4-stat `MiniStat` strip (Venues/Markets/Packed/Open). The old `StatCard` grid was removed.
- Footer is 4 columns: brand blurb (About-Us-style business copy), Platform links, Company (About Us / Careers / Contact), Get in Touch (hello@/press@ mailto links + "Run a venue?" → `/operators`). Careers link testid `link-footer-careers`.
- `/careers` page: static roles list with mailto apply links (careers@scenepulse.app), testids `career-role-{slug}`; About page has a "See open roles" CTA (`link-about-careers`).
- Seed script also seeds The Wire: 2–4 past-experience comments per venue (~929 total) with deterministic pseudo-random authors/messages and createdAt spread 6h–40 days back; pools are per-category plus a speakeasy pool (matched via `bestFor.includes("Speakeasy")`). Venue insert uses `.returning()` for ids; comments insert in chunks of 500.
- Pages share a `PageIntro` breadcrumb header (`components/page-intro.tsx`). `/speakeasies` groups all speakeasies by market with per-card "Full intel" links (testids `speakeasy-page-card-{id}`, `speakeasy-page-intel-{id}`).
- Venue detail page: crowd score, wait time, headcount, line trend, seating odds, noise level, cover cost, best arrival window/timing strategy, comments ("The Wire", first in sidebar), live reports feed below it, watchlist bookmark, "Open Maps" link.
- Markets page (13 North American markets) and "For Operators" hospitality market-gap page.
- Seeded with 310 venues across 13 markets, including real named venues with source attribution (sourceLabel/sourceUrl: Google Maps listing, Yelp pick, Uber Eats/DoorDash/Grubhub favorite, Local favorite). 53 are speakeasies (3–5 per market) surfaced in "The Speakeasy Files" scroller, the `/speakeasies` page, and the speakeasy intent filter.
- Venue feed paginates 12 at a time ("Load more" button), with a "Showing X of Y venues" count line and removable active-filter chips (search/market/category/intent + Clear all) above the grid; filter changes reset pagination.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/scene-pulse run typecheck` (not `build`) to verify the frontend from the shell — `build` needs workflow-provided `PORT`/`BASE_PATH`.
- After adding new generated-hook usages (Orval), double check mutate-payload shapes — e.g. `useCreateVenueComment()`/`useCreateVenueReport()` take no args; `venueId` goes inside the mutate payload, not the hook call.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
