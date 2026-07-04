---
"@marko/vite": minor
---

Resolve `x.marko?persisted` imports (emitted by generated persisted
`?update` entries) to the template's persisted entry — the render graph
compiled with `entry: "persisted"`, carrying the registry registrations
the main dom module no longer ships. Pairs with the
`@marko/runtime-tags` slim-hydration change.
