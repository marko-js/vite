---
type: bug
impact: high
effort: med
site: src/index.ts › resolveId
---

# Stop treating a `.marko` reached from a JS module as a page entry in linked SSR; it breaks component packages and tags-API interop

`checkIsEntry` defaults to `() => true`, and in the `ssr && linked` branch of `resolveId` — reached for any non-virtual, non-Marko importer that `checkIsEntry` accepts — every `.marko` so imported is classified as a `serverEntry`, so a plain JS barrel — `export { default as Card } from "./card.marko"`, the normal way to publish a component library — turns each template it re-exports into a page entry with the server-entry wrapper substituted in its place. For a class-API template this silently attaches page-asset machinery; for a template from a dependency it hard-errors with `@marko/vite: the Marko compiler did not report an asset id for …`; and for a tags-API template the wrapper means the compiler never sees a tag usage, so it never injects `marko/src/runtime/helpers/tags-compat/html-debug.mjs` and rendering dies with `TypeError: Cannot read properties of undefined (reading 'boundary')`. That shim is process-global once loaded, which makes the failure order-dependent in both dev and production: a route that 500s starts returning 200 as soon as some other route deep-imports any tags template, so a canary hitting the right URL first hides the bug until a restart reorders traffic. `src/glob-import-transform.ts` produces the same shape, since it appends bare side-effect `import "./x.marko"` declarations rather than tag usages. Reproduces identically under npm and pnpm, and the `isEntry` escape hatch is documented in neither README. Narrow that branch so a template reached through a JS module is an entry only when it is genuinely a page, leaving the client, non-linked, virtual-importer and Marko-importer paths as they are.

Check: `src/lib/barrel.js` with `export { default as Counter } from "../components/tags-counter.marko"` and a page rendering `<${Counter}/>` through it 500s with the `boundary` TypeError, while a page importing `../components/tags-counter.marko` directly renders 200; request the direct page once and the barrel page then returns 200 too, on the same server. The dev log shows the barrel import rewritten to `…/tags-counter.server-entry.marko`.
