---
"@marko/vite": patch
---

Make every dynamic import of a chunk wait for its stylesheets, so a lazily loaded template imported again while its CSS is still loading no longer renders unstyled.
