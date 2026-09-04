---
type: dx
impact: high
effort: low
site: README.md › # Linked Mode
---

# Document how to produce a linked-mode production build

`grep -c 'vite build' README.md` is 0: the file has no build section at all. `# Linked Mode` shows a dev-server snippet whose production branch is `loadTemplate = () => import("./dist")`, and nothing anywhere says what produces `./dist` — not the command, not that the server and client are separate environments, not that the server build has to run first, not where the client assets land, and not that a plain `vite build` is not enough. The only pointer is a link to an app in `marko-js/examples`, which is a separate repository, so every reader who needs to ship has to leave the docs and reverse-engineer `src/index.ts`. Four independent first-use passes each lost 15-25 minutes here and arrived at different wrong answers before finding `vite build --app` plus an `environments` config. Write the working shape inline: the `environments.ssr` / `environments.client` config, the single `vite build --app` invocation, the resulting directory layout, and how the server picks up the client's hashed filenames.

Check: `grep -n 'vite build\|--app\|builder\|environments\|production' README.md` returns only the `process.env.NODE_ENV === "production"` line inside the dev-server snippet.
