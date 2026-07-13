---
"@marko/vite": minor
---

Add experimental persisted pages support. `x.marko?persisted` imports
(emitted by generated `?update` entries) resolve to the template's
persisted entry — the render graph compiled with `entry: "persisted"`,
carrying the registry registrations the main dom module no longer ships
(pairs with the `@marko/runtime-tags` slim-hydration change). The `?update`
entry compiles share the whole build's compiler `cache` instead of a fresh
one per entry kind, so update entries reuse the parse/migrate/analyze
result the build already produced instead of re-processing templates.
Requires a `@marko/runtime-tags` with persisted support.
