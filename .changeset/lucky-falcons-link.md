---
"@marko/vite": minor
---

Add support for the Marko compiler's built-in asset orchestration. When the installed compiler and translator support it, the plugin lets the compiler generate server entry wrappers and flush assets, including assets for lazily loaded (`import ... with { load }`) templates.

The `getMarkoAssetCodeForEntry` plugin api is now deprecated. It targets the legacy asset handling, so any plugin providing it opts the build out of the compiler's built-in asset orchestration.
