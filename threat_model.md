# Threat Model

## Project Overview

ScenePulse is a public-facing React + Express application that shows live venue conditions across North American markets. The production deployment consists of a React frontend in `artifacts/scene-pulse` and an Express API in `artifacts/api-server` backed by PostgreSQL via Drizzle. The product intentionally exposes venue discovery data publicly, but it also accepts crowd reports, comments, reactions, and watchlist changes from the public internet. `artifacts/mockup-sandbox` is a dev-only design surface and is out of scope unless production reachability is demonstrated.

## Assets

- **Shared venue state** — crowd score, crowd level, wait time, watchlist status, and derived hot-zone rankings. This is the core product data shown to every visitor; integrity matters more than confidentiality.
- **User-submitted content** — reporter names, comment author names, comments, replies, and vibe notes. This is attacker-controlled content that can be used for spam, defacement, or client-side injection if rendered unsafely.
- **Operational data** — market coverage, source links, and venue metadata stored in PostgreSQL. Broad corruption would degrade user trust and site usefulness.
- **Infrastructure secrets** — `DATABASE_URL` and any future auth or API secrets held in environment variables. These are not currently exposed to the client and must remain server-only.

## Trust Boundaries

- **Browser to API** — all frontend input crosses into the Express API. The browser is untrusted even when the feature is intentionally public.
- **API to PostgreSQL** — the API has direct write access to all venue, comment, and report tables. Any missing server-side control on write routes becomes a database integrity issue.
- **Public read to public write** — many routes are intentionally public to read, but write endpoints still need anti-abuse controls because the deployment is publicly reachable.
- **Production to dev-only artifacts** — `artifacts/mockup-sandbox` is not production. Findings there should be ignored unless a production path imports or serves it.

## Scan Anchors

- Production API entry points: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`
- Highest-risk code: `routes/reports.ts`, `routes/comments.ts`, `routes/venues.ts`, `lib/db/src/schema/*`
- Rendering of attacker-controlled content: `artifacts/scene-pulse/src/components/venue-reports.tsx`
- Public surface: all current `/api/*` routes are unauthenticated; no admin surface is present
- Dev-only surface to skip by default: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The application currently has no authenticated user identity, so any caller can claim any reporter or author name. If public posting remains anonymous, the system must treat displayed names as untrusted self-asserted labels and must not let them confer privilege or trust.

### Tampering

The main risk in this project is unauthorized modification of shared venue state. Public write endpoints must not let an arbitrary internet user overwrite crowd conditions, reactions, or watchlist state in a way that changes what all other users see without abuse controls, per-user isolation, or equivalent server-side safeguards.

### Information Disclosure

Most venue data is intentionally public, so confidentiality risk is limited. The relevant guarantee is that only intended public data is exposed: secrets, internal-only fields, and any content meant to be gated behind a server-enforced boundary must not be returned by public API routes.

### Denial of Service

Because the deployment is public and accepts anonymous writes, the API is susceptible to automated spam and storage amplification. Public mutation endpoints must enforce practical rate, size, and abuse limits so a remote attacker cannot cheaply flood the database or distort the live feed.

### Elevation of Privilege

There is no formal role system today, but privilege still exists wherever one visitor can change shared global state. Features presented as user-specific or gated must be enforced server-side; client-side hiding, localStorage flags, or route obscurity are not sufficient access controls.