---
name: Map embeds and interactive maps without API key
description: How to add embedded or fully interactive maps (single-pin previews vs. multi-pin clickable maps) without a Google Maps API key or billing setup.
---

**Single-pin preview:** `https://www.google.com/maps?q=<lat>,<lng>&z=<zoom>&output=embed` renders a full interactive Google Maps iframe (pin, zoom/pan, "Open in Google Maps" link) with no API key, no billing, and no integration setup. Not suitable for custom pins/markers beyond the single query point.

**Multi-pin interactive map (no key needed either):** Leaflet + react-leaflet with free CARTO dark tiles gives a fully interactive map with custom `divIcon` pins, click handlers, fitBounds/flyTo — no API key or billing. react-leaflet v5 requires React 19.

- Tile URL that works in this environment: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (also `light_all`).
- **Gotcha:** the subdomain variant `{s}.basemap.cartocdn.com` fails DNS (ERR_NAME_NOT_RESOLVED) here — use the plain `basemaps.cartocdn.com` host with no `{s}` placeholder. Verify tile hosts with curl before wiring them in.
- Leaflet's panes create their own stacking context; wrap the map container with `z-0` so overlays/navbars above it aren't covered.

**Why:** Users often want a "real map" view but don't want Maps JS API keys/billing for previews, and even multi-pin interactive use cases don't need a paid SDK.

**How to apply:** Use the Google embed iframe for a simple single-location preview; use Leaflet + OSM/CARTO tiles when you need multiple clickable pins, custom markers, or synced detail panels.
