---
"@marko/vite": patch
---

Improve tree-shaking of server-only content in client builds. A template's imports are now treated as side effect free unless they're a `.marko` file, a client side asset, or an explicit bare `import "x"` — so an `import { onlyServer }` used only in a `server` block drops from the client bundle instead of being pulled in for its assumed side effects.
