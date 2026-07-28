---
"@marko/vite": patch
---

Fix a crash when vitest resolves a vite config that has no `test` section. The plugin read `config.test.environment` unguarded in test mode, so simply having `@marko/vite` installed made `vitest run` fail before any test loaded.
