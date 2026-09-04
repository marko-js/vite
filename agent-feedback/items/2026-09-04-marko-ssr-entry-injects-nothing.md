---
type: bug
impact: high
effort: med
site: src/index.ts › resolveId
---

# Treat a `.marko` loaded directly as the SSR entry as a page entry; today it renders with no assets at all

`resolveId` only classifies a template as `InternalFileKind.serverEntry` when it has a non-Marko `importer`, so a module loaded as the root of an SSR request — `vite.ssrLoadModule("./template.marko")`, which is exactly the shape `README.md` › `# Linked Mode` documents — never reaches that branch and `checkIsEntry` is not consulted at all. The page still renders and still emits its `$MC` hydration payload, so the response looks correct, but no client entry, no `/@vite/client` and no stylesheet are injected: nothing calls `init()`, the page is inert, and there is no HMR. Nothing warns, in dev or in build. Either classify an importerless SSR root as a server entry, or error when linked mode is asked to render a template that was never treated as one — and fix the README example either way, since it is the only end-to-end code the docs ship.

Check: with `plugins: [marko()]` and `appType: "custom"`, serve `await vite.ssrLoadModule("./src/pages/home.marko")` and `curl` it: `grep -cE 'client-entry|@vite/client'` is 0. Serve `await vite.ssrLoadModule("./src/index.js")`, where `index.js` imports and renders the same template, and the same grep matches the injected `@vite/client`, the `.client-entry.marko` script and the stylesheet.
