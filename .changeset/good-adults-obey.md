---
"@marko/vite": patch
---

Fix issue where vite dependency scan comes from a js/ts file into a Marko file. In this case we no longer give vite back the hydrate output, but the full compiled template from esbuild.
