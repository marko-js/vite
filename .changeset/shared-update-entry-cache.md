---
"@marko/vite": patch
---

Persisted `?update` entry compiles share the whole build's compiler
`cache` instead of a fresh one per entry kind. The cache stores each
file's parse/migrate/analyze result (every compile translates a clone)
and analysis is identical across persisted modes, so update entries no
longer re-parse and re-analyze templates the build already processed.
Requires the paired `@marko/runtime-tags` fix for per-translate
abort-signal id allocation.
