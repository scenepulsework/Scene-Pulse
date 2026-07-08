---
name: Mobile map embeds without API key
description: How to add a lightweight embedded map (e.g. mobile-first "live map" view) without a Google Maps API key or billing setup.
---

`https://www.google.com/maps?q=<lat>,<lng>&z=<zoom>&output=embed` renders a full interactive Google Maps iframe (pin, zoom/pan, "Open in Google Maps" link) with no API key, no billing, and no integration setup.

**Why:** Users often want a "real map" view (especially mobile-first) but don't want to set up the Maps JavaScript API/Embed API key just for a simple location preview. This URL format is the same one used for the "share location" search embed and works unauthenticated.

**How to apply:** Use this pattern when a spec calls for an embedded map as a primary/secondary view (e.g. mobile map vs. desktop custom pin visualization) and a full JS mapping SDK (Mapbox GL, Google Maps JS API) is overkill. Compute the query point (single venue lat/lng, or an average/centroid across a venue list) and interpolate into the URL as `<iframe src=... />`. Not suitable for custom pins/markers beyond the single query point — for multi-pin interactive maps, still need Mapbox GL JS or Google Maps JS API with a real key.
