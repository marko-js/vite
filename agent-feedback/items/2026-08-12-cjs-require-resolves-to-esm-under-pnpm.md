---
type: bug
impact: med
effort: med
site: src/index.ts › plugin
---

# Resolve bundled CJS `require()`s of dual-published deps to the CJS build so the SSR server starts

When an SSR build bundles a dependency whose CJS code `require()`s a dual-published package, rolldown can resolve that require to the package's ESM build; the emitted `new (init_x(), __toCommonJS(x_exports))(...)` interop then throws `TypeError: ... is not a constructor` at server startup, because the ESM build's `export default` leaves the class under `.default` of the namespace. Repro chain from marko-js/run's `micro-frame-fetch` fixture: `@micro-frame/marko` -> `make-fetch-happen@12` -> `cacache@17` -> `require("lru-cache")` with `lru-cache@7` dual-published. Under pnpm the chain is private to `@micro-frame/marko`, so Vite cannot externalize it and bundles the whole chain; npm's flat layout externalizes and never hits it. The resolution is nondeterministic: with byte-identical resolve config, plugin pipeline, importer, and `kind: "require-call"` options, the same `this.resolve` returns the CJS entry in one host process and the ESM entry in another, which is a rolldown resolver defect worth reporting upstream. Adding `"require"` to `resolve.conditions` does not help, since with both conditions active the package's `exports` key order wins. A verified fix: in a server-build `resolveId` hook, for a bare `require-call` specifier whose importer is inside `node_modules`, resolve with `createRequire(importer).resolve(specifier)` and return that absolute path only when it differs from `createRequire(<root>/package.json).resolve(specifier)`. The same-path case must keep the default flow so root-resolvable deps still externalize, and the difference check rather than mere root-resolvability matters because a hoisted different major at the root otherwise defeats the guard. Skip builtins and relative or absolute specifiers.

Check: build marko-js/run's `micro-frame-fetch` fixture under pnpm without `make-fetch-happen` in the workspace-root `devDependencies`, then start the SSR server; it throws `TypeError: ... is not a constructor`.
