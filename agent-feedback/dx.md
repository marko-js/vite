# Developer Experience

Friction in builds, tests, tooling, or repo workflows. Format and rules: [README.md](README.md).

## Dev server `close()` never settles once a fixture request re-triggers dep optimization

`src/__tests__/query.test.ts` › `describe("templates with a query")` | 2026-07-24 | impact:low | effort:med

Creating a `vite.createServer` over `src/__tests__/fixtures/browser-basic` with the plugin, transforming `/src/index.js` (or `/src/template.marko`) and then requesting any second id — `?raw`, `?url`, an unknown marker — leaves `await server.close()` pending forever, so a mocha `after` hook times out. It does not reproduce on a plugin-free project, nor with the plugin over a project that has no optimizable deps, so it needs the dep optimizer that the plugin's `optimizeDeps.include`/`entries` defaults set up; whether the stall is vite's or the plugin's is unresolved. `optimizeDeps: { noDiscovery: true, include: [] }` on the test server avoids it, which is what the query tests do. Re-verify by dropping that option from the server in `src/__tests__/query.test.ts`.
