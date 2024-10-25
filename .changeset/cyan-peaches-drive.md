---
"@marko/vite": patch
---

Fixes a caching regression caused by having a different SSR config compared to the rest of the configs and using that in a transform (which is cached).
