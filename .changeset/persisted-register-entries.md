---
"@marko/vite": minor
---

Resolve `x.marko?register` imports (emitted by generated persisted
`?update` entries) to the template's register entry — the persisted dom
module compiled with `persisted: "register"`, carrying the registry
registrations the main dom module no longer ships. Pairs with the
`@marko/runtime-tags` slim-hydration change.
