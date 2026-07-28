---
name: Duplicate @types/react in pnpm monorepo
description: How to fix "Two different types with this name exist" JSX/Ref errors across artifacts
---

Root `package.json` has `pnpm.overrides` pinning `@types/react` / `@types/react-dom` to a single exact version.

**Why:** With the mobile app pinning `~19.1.x` and the catalog at `^19.2.0`, pnpm resolved two `@types/react` copies; packages without an @types peer (react-day-picker, lucide) fell back to the hidden-hoisted copy, producing incompatible `Ref`/`VoidOrUndefinedOnly` typecheck errors in web artifacts.

**How to apply:** If those errors reappear after dependency changes, keep/update the overrides in the root package.json and run `pnpm install`; don't chase the individual component errors.
