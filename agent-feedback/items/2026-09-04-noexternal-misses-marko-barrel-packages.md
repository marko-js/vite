---
type: bug
impact: med
effort: low
site: src/index.ts › configEnvironment
---

# Widen the SSR `noExternal` rule to packages that re-export `.marko`, not just specifiers ending in `.marko`

`configEnvironment` sets the ssr environment's `resolve.noExternal` to `/\.marko$/`, which matches the specifier rather than what it resolves to. A deep import (`import Card from "dep/card.marko"`) is therefore bundled correctly, while a dependency with a JS entry that re-exports templates (`index.js` containing `export { default as Card } from "./card.marko"`) is externalized as a package, so Node itself is asked to load the `.marko` and the request dies with a bare `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".marko"` and a 20-frame `node:internal/modules/esm` stack that names neither Marko nor the plugin. A barrel entry is the ordinary way to publish a Marko component package, so this is hit by consumers rather than authors, and the error gives them nothing to search for. Vite types `noExternal` as `string | RegExp | (string | RegExp)[] | true`, so a predicate is not available: resolve the entries of `.marko`-re-exporting packages during plugin setup and add their names to the array, or catch the case in a resolve hook. Either way give the failure a plugin-authored message. Reproduces identically under npm and pnpm.

Check: `npm pack` a package whose `index.js` is `export { default as Card } from "./card.marko"`, install the tarball, import the named export from a page template, and run `vite dev`; the request 500s with `ERR_UNKNOWN_FILE_EXTENSION`. Changing the import to the deep path `dep/card.marko` renders.
