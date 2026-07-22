---
"@marko/vite": patch
---

Stop following symlinks when discovering known templates for optimized builds: pnpm layouts link node_modules as cyclic symlink graphs, so the walk previously never terminated and exhausted the heap.
