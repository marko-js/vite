---
type: bug
impact: med
effort: low
site: src/render-assets-runtime.ts › getRenderAssetsRuntime
---

# Render the `body` slot from `getAppend`, not `body-prepend` a second time

The generated runtime's `getPrepend` renders `head-prepend`, `head` and `body-prepend`, and `getAppend` then renders `body-prepend` again instead of `body`, so the end-of-document assets `manifest-generator` puts in `DocManifest.body` are never emitted. The failure is silent rather than duplicated markup: `renderAssets` keeps a per-slot `___viteWrittenEntries-<slot>` watermark, so the second `body-prepend` pass returns an empty string. `src/render-assets-transform.ts` sets the opposite contract — `<slot>-prepend` renders at the start of a `<head>`/`<body>` and a bare `<slot>` at the end — and `src/server-entry-template.ts` calls both halves, so only the append half is wrong. Nothing covers it because `supportsLinkAssets()` is true for any compiler at or past the `linkAssets` release, so every fixture takes the newer `src/link-assets.ts` path and this legacy runtime, still reachable through the `@marko/compiler@^5` peer range, has no fixture at all.

Check: load the string `getRenderAssetsRuntime({ isBuild: true })` returns as an ES module and call its `getAppend` with a `g` whose `___viteEntries` carries a `body` slot; it returns `""`. `grep -n 'body-prepend' src/render-assets-runtime.ts` shows the identifier twice, once in each function.
