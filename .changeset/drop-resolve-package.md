---
"@marko/vite": patch
---

CommonJS module detection (`isCJSModule`) now resolves through `resolve-sync` instead of the legacy `resolve` package, removing `@marko/vite`'s last direct dependency on `resolve`. Behavior is unchanged: the resolved package's `package.json` is inspected the same way, including packages whose exports map exposes no resolvable entry.
