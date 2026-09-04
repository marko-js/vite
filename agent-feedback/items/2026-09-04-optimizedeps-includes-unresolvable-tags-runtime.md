---
type: dx
impact: low
effort: low
site: src/index.ts › config
---

# Drop `optimizeDeps.include` entries that do not resolve; a Marko 5 app under pnpm warns on every cold start

The client branch of `config` pushes `compiler.getRuntimeEntryFiles("dom", opts.translator)` straight into `optimizeDeps.include`. On `@marko/compiler@5.42.3` that list ends with `@marko/runtime-tags/debug/dom`, the tags-compat interop entry, even for the Marko 5 translator. Under npm that package is hoisted flat and resolves; under pnpm it stays private to `marko`'s own subtree, so every cold dev start and every cold Vitest run prints `Failed to resolve dependency: @marko/runtime-tags/debug/dom, present in ... 'optimizeDeps.include'` on an otherwise passing run. The app works, so the line is pure noise — but it reads like a broken install in CI logs, and two separate first-use passes spent time confirming it was harmless. Filter the list to entries that resolve from the project root before assigning it, or mark the tags-compat entry optional.

Check: in a pnpm project with `marko@5`, `@marko/compiler@5` and `plugins: [marko()]`, `rm -rf node_modules/.vite` then start the dev server; the warning prints while the page renders. `node -e 'console.log(require("@marko/compiler").getRuntimeEntryFiles("dom"))'` lists `@marko/runtime-tags/debug/dom`, and `require.resolve` of that specifier from the project root throws `MODULE_NOT_FOUND`.
