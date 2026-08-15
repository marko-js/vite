---
"@marko/vite": patch
---

Treat zero-runtime stylesheet modules (`*.css.ts`, `*.css.js`) as having side effects so their styles are still emitted when only server-rendered markup uses them.
