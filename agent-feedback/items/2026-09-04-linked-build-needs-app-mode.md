---
type: bug
impact: high
effort: med
site: src/index.ts › buildApp
---

# Fail a linked build that never ran the client environment, instead of shipping a broken site or blaming build order

Linked mode only produces a complete build when Vite runs an app build, because that is what triggers the plugin's `buildApp` hook, and neither path that misses it is diagnosed. With `build.ssr` set and a plain `vite build`, Vite builds the ssr environment alone: the command exits 0 with a normal success summary, and the served output has zero `<link rel=stylesheet>`, zero module scripts, and asset URLs that 404 — with the recommended `build.emptyOutDir: false`, a stale `dist/assets` from an earlier good build hides it entirely. With `environments.ssr` and `environments.client` declared but no `builder` key, Vite builds only the client environment and the `options` hook reports `You must run the "ssr" build before the "browser" build.`, which names build order when the real cause is that no app build ran. Detect the case — a linked client build with no server manifest and no preceding `buildApp` — and say to run `vite build --app` or add a `builder` key. Worth fixing in the same pass: because `store.write(serverManifest)` is guarded by `if (!isBuildApp)`, the `ReadOncePersistedStore` handoff through `os.tmpdir()/marko-vite-storage.json` is now unreachable on an app build, and that file is shared by every project on the machine under the single uid `vite-marko`.

Check: in an app with `build.ssr` set, `rm -rf dist && npx vite build` exits 0 having built only the ssr environment, and `curl` of the served page has no stylesheet link, no `<script src>`, and a 404 for the `<img>` it references. In an app with `environments.{ssr,client}` and no `builder` key, `npx vite build` fails with `[marko-vite:pre] You must run the "ssr" build before the "browser" build.`; adding `builder: {}` with no keys makes the same command build both environments and succeed.
