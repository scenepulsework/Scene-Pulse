---
name: React Compiler + Metro forward refs
description: React Compiler breaks JS hoisting in Metro bundles — both function components and const StyleSheets must appear before the component that uses them in source order.
---

## Rule
When React Compiler is enabled (`"React Compiler enabled"` in Expo Metro logs), **neither function declarations nor `const` variables** are reliably available to components that appear earlier in the file. Always define:
1. StyleSheet `const` objects
2. Helper/sub-components (`function` declarations)

**BEFORE** the parent component that references them — not after.

**Why:** React Compiler transforms components into compiled closures. Inside those closures, forward references to both function declarations and `const` values that appear later in the file throw `ReferenceError: Property 'X' doesn't exist` at runtime. Standard JavaScript hoisting rules do not apply after React Compiler's transformation.

**How to apply:**
- When adding a new `StyleSheet.create(...)` for a new component, place it before that component in the file.
- When adding a helper component, place it above the parent that uses it.
- This applies to `HomeScreen`, `ListHeader`, and any other component compiled with React Compiler in the Expo app.
- If in doubt, keep the ordering: `const styles` → sub-components → parent component.
