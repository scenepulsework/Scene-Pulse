---
name: React Compiler + Metro forward refs
description: React Compiler breaks JS function hoisting in Metro bundles — helpers must appear before their callers in source order.
---

## Rule
When React Compiler is enabled (`"React Compiler enabled"` in Expo Metro logs), function declarations at module scope are NOT reliably hoisted for use inside React components that appear earlier in the file. Always define helper/sub-components **before** the parent component that references them.

**Why:** React Compiler transforms components into compiled closures. Within those closures, forward references to module-level functions that appear later in the file throw `ReferenceError: Property 'X' doesn't exist` at runtime, even though plain JavaScript hoisting would normally make them available.

**How to apply:** When adding a new helper component to an existing file, place it ABOVE the component that calls it — not at the end of the file. This applies to `ListHeader`, `HomeScreen`, and any other component in the Expo app that uses React Compiler optimizations.
