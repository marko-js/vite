---
type: bug
impact: high
effort: med
site: src/index.ts › load
---

# Recover from a compile error in a template that never compiled; today the 500 outlives the fix

A `.marko` that fails to compile on its very first request wedges the dev server permanently: fixing the file, saving, and reloading returns a byte-identical 500 still quoting the deleted line, and only killing the process recovers. The change is seen — `DEBUG=vite:hmr` prints `[file change] src/page.marko` followed by `(client)/(ssr) [no modules matched]`, and `hotUpdate` runs, so `compiler.taglib.clearCaches()` and `baseConfig.cache.clear()` both fire and the compiler's own content-hashed cache is not the stale layer. Neither `load` nor `transform` is re-invoked on the second request: the failing id is the derived virtual `<name>.server-entry.marko`, which never entered the module graph because it never compiled, so nothing invalidates it and Vite's module runner replays the cached rejected promise it stored the first time. The asymmetry is Marko-specific and it hits exactly when a newcomer is least able to diagnose it — a server that has already served the page once recovers normally, and a cold syntax error in a plain `.js` also recovers. Invalidate the derived entry ids for a changed template even when the graph has no module for them.

Check: in a middleware-mode app whose `src/index.js` does `import template from "./page.marko"`, put `style {\n  .bad { color: red }\n}` at the top of `src/page.marko` _before_ starting the server; `curl` returns a 500 CompileError at `page.marko:6`, and after deleting those lines and waiting 3s `curl` returns the same 500 still quoting `> 6 | style {`. Break and fix the same template on a server that has already served it 200 and it recovers.
