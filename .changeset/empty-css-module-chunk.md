---
"@marko/vite": patch
---

Stop emitting an empty JS chunk (and injecting a script tag for it) for css modules whose class name map is only read on the server. In the client build a css module import now resolves to a virtual that re-exports the class map from vite's `?transform-only` view of the module (tree shaken whenever the map goes unused) and loads the compiled css as a plain stylesheet, replacing the previous blanket `no-treeshake` marking. With `build.modulePreload.polyfill` disabled, a page whose only client asset is a stylesheet now ships no JS at all.
