---
"@marko/vite": patch
---

Ensure browser entry query is added before transformIndexHTML. Without this Vite was incorrectly caching the module url.
