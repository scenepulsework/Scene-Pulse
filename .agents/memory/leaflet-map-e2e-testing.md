---
name: Leaflet map e2e testing quirk
description: Automated browser clicks on Leaflet canvas markers are unreliable when pins are close together; use list-based fallback controls instead.
---

When writing a Playwright/`runTest()` test plan against a Leaflet map with many markers (e.g. dense clusters of city pins), do not rely on clicking raw marker DOM elements — nearby markers overlap and intercept each other's pointer events, causing click timeouts.

**Why:** Leaflet renders markers as absolutely-positioned siblings with no z-index/hit-area separation; when two pins are close in screen space, the marker on top swallows clicks intended for the one behind/below it. This is a map-rendering limitation, not an app bug.

**How to apply:** Prefer any list-based or button-based alternative the UI already exposes for selecting the same target (e.g. a "Hottest on the map" row, a search-result suggestion, a "Show on map" link) over clicking the canvas pin directly, when writing e2e test plans for map-driven selection flows.
