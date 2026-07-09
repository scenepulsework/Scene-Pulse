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
- Seed gotcha: DC entries must use city "Washington DC" (no comma) — a "Washington, DC" variant splits it into a 14th market.

## Product

- Home dashboard (section order: hero → Live Pulse map → Speakeasy Files → Services → Markets → Operators → About → Contact; map is front-and-center on mobile too): hero stats, hot zones, interactive Leaflet map with side panel, quick-pick intent filters (incl. Speakeasy), category filters, search with live suggestions dropdown, market filter, paginated venue feed with per-card "show on map", back-to-top button, html smooth scrolling.
- Venue detail page: crowd score, wait time, headcount, line trend, seating odds, noise level, cover cost, best arrival window/timing strategy, live reports feed, comments ("The Wire"), watchlist bookmark, "Open Maps" link.
- Markets section (13 North American markets) and "For Operators" hospitality market-gap section.
- Mobile sidebar menu with anchor links: Map, Speakeasies, Services, Markets, For Operators, About, Contact (same order as desktop nav).
- Seeded with 219 venues across 13 markets, including real named venues with source attribution (sourceLabel/sourceUrl: Google Maps listing, Yelp pick, Uber Eats/DoorDash/Grubhub favorite, Local favorite). 27 are speakeasies (1–2 per market) surfaced in "The Speakeasy Files" section and the speakeasy intent filter.
- Venue feed paginates 12 at a time ("Load more" button), with a "Showing X of Y venues" count line and removable active-filter chips (search/market/category/intent + Clear all) above the grid; filter changes reset pagination.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/scene-pulse run typecheck` (not `build`) to verify the frontend from the shell — `build` needs workflow-provided `PORT`/`BASE_PATH`.
- After adding new generated-hook usages (Orval), double check mutate-payload shapes — e.g. `useCreateVenueComment()`/`useCreateVenueReport()` take no args; `venueId` goes inside the mutate payload, not the hook call.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
