---
name: react-native-maps + Expo web
description: react-native-maps 1.18.0 (Expo Go pinned version) breaks Metro web bundling; use platform-split files
---

react-native-maps must stay pinned to exactly 1.18.0 for Expo Go, but that version imports `react-native/Libraries/Utilities/codegenNativeCommands`, which fails Metro web bundling ("Importing react-native internals is not supported on web") — despite skill docs listing it as web-polyfilled.

**Why:** hit this building the mobile map screen; the whole web preview 500'd until the import was isolated.

**How to apply:** never import react-native-maps from a file that bundles on web. Split into `Component.tsx` (native MapView) and `Component.web.tsx` (fallback UI, e.g. tappable list); Metro picks the `.web` variant automatically. `import type`/`export type` from the native file inside the `.web` file is safe (erased at compile).
