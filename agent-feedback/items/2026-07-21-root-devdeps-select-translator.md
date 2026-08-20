---
type: unclear
impact: med
effort: low
site: package.json › devDependencies
---

# Document that a root `@marko/runtime-*` devDependency silently switches the default translator

`@marko/compiler`'s default `translator` config scans the root package.json's dependencies, devDependencies, and peerDependencies for names matching `/^(?:@marko\/|marko-)runtime-/` and switches the default translator if one is found. Adding `@marko/runtime-tags` as a devDependency here, for example to satisfy tags-API test fixtures that import it, silently breaks every class-API fixture with a cryptic `CompileError: Invalid attribute name` on `class {`. The pnpm setup works around this with `publicHoistPattern: "@marko/runtime-tags"` in `pnpm-workspace.yaml` instead of declaring the dep. A comment near the devDependencies or in the test docs stating the constraint would stop someone from "fixing" the phantom dep the obvious way.

Check: add `@marko/runtime-tags` to root `devDependencies`, then run `pnpm test`; class-API fixtures fail with `CompileError: Invalid attribute name`.
