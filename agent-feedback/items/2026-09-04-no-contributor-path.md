---
type: dx
impact: med
effort: low
site: package.json › scripts
---

# Write down the contributor path, and close the checks that silently skip files

Nothing in the repo tells a first-time contributor how to work in it: there is no `CONTRIBUTING.md`, `README.md` is user-facing and ends at the Code of Conduct, `AGENTS.md` is seven lines about `agent-feedback/`, and `.github/` holds only a code of conduct, issue templates and a PR template. The whole sequence — pnpm, `pnpm run build`, `pnpm run ci:test`, and a changeset — exists only in `.github/workflows/ci.yml` and the `scripts` block, so it has to be reverse-engineered. Three gaps make that worse. `pnpm test` runs mocha through `tsx`, which strips types without checking, so a test that does not compile passes; `tsc -b` runs only inside `pnpm run lint`, and CI's test job never runs it. `lint:prettier` globs `"./**/*{.ts,.js,.json,.md,.yml,rc}"`, which matches no `.mts`, `.mjs`, `.cjs` or `.yaml`, so `pnpm run lint` is green while `build.mts` is unformatted; `.lintstagedrc.json` has the same gap, so the pre-commit hook will not fix it either. And a changeset is required by the release pipeline but named nowhere, while `pnpm run change` is interactive-only — with stdin closed it opens the prompt and hangs, and it warns `Failed to find where HEAD diverged from "main"` on a checkout with no local `main`. Add a short contributing section covering the loop and the changeset (including the hand-written `.changeset/<name>.md` fallback), widen both prettier globs, and put the typecheck where a green test run implies compilation. Two smaller ones in the same file: `report` is `open ./coverage/lcov-report/index.html`, which fails on Linux and on both CI runner images, and there is no `engines` field or `.nvmrc`, so nothing pins the Node version the pinned toolchain wants.

Check: `grep -ril contribut . --exclude-dir=node_modules --exclude-dir=.git` matches only `LICENSE` and the PR template. `pnpm run lint` exits 0 while `./node_modules/.bin/prettier -l build.mts` exits 1 and prints `build.mts`. `timeout 25 pnpm run change < /dev/null` hangs on the interactive prompt.
