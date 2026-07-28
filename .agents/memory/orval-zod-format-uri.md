---
name: Orval codegen vs zod v3
description: format uri in openapi.yaml breaks generated zod (z.url missing)
---

Do not use `format: uri` on string properties in `lib/api-spec/openapi.yaml`.

**Why:** Orval emits `zod.url()` (zod v4 API) but `lib/api-zod` compiles against zod v3, so `typecheck:libs` fails with "Property 'url' does not exist".

**How to apply:** Use a plain `type: string` (optionally with a description) for URL fields, then rerun codegen.
