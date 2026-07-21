# Unclear Code & Docs

Things that were hard to understand, and what would have clarified them. Format and rules: [README.md](README.md).

## Root devDependencies silently select the default Marko translator

`package.json` › `devDependencies` | 2026-07-21 | impact:med | effort:low

`@marko/compiler`'s default `translator` config scans the root package.json's dependencies/devDependencies/peerDependencies for names matching `/^(?:@marko\/|marko-)runtime-/` and switches the default translator (e.g. to `@marko/runtime-tags/translator`) if one is found. Adding `@marko/runtime-tags` as a devDependency here (e.g. to satisfy tags-API test fixtures that import it) silently breaks every class-API fixture with cryptic `CompileError: Invalid attribute name` on `class {`. The pnpm conversion works around this via `publicHoistPattern: "@marko/runtime-tags"` in pnpm-workspace.yaml instead of declaring the dep. A comment near the devDependencies or in test docs explaining this constraint would prevent someone from "fixing" the phantom dep the obvious way.
