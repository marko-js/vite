---
type: dx
impact: low
effort: med
site: src/__tests__/query.test.ts › describe("templates with a query")
---

# Fix or explain the dev server `close()` that never settles once a request re-triggers dep optimization

Creating a `vite.createServer` over `src/__tests__/fixtures/browser-basic` with the plugin, transforming `/src/index.js` (or `/src/template.marko`) and then requesting any second id (`?raw`, `?url`, an unknown marker) leaves `await server.close()` pending forever, so a mocha `after` hook times out. It does not reproduce on a plugin-free project, nor with the plugin over a project with no optimizable deps, so it needs the dep optimizer that the plugin's `optimizeDeps.include`/`entries` defaults set up. Whether the stall is Vite's or the plugin's is unresolved. `optimizeDeps: { noDiscovery: true, include: [] }` on the test server avoids it, which is what the query tests do; a comment at that option naming the hang would stop the next agent from removing it as noise.

Check: drop `optimizeDeps: { noDiscovery: true, include: [] }` from the server in `src/__tests__/query.test.ts` and run the suite; the `after` hook times out.
