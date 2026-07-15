---
"@marko/vite": patch
---

Require marko@5.39.14 for the class runtime's `linkAssets`/`entry` support. Older versions' generated `withPageAssets` page entry ignored a configured `runtimeId`, so the server serialized hydration data under the default `$MC` key while the client entry read `$<runtimeId>_C` and never hydrated (for example, `onMount` never firing). Older class runtimes now fall back to the legacy asset orchestration, which honors the `runtimeId`.
