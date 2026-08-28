---
type: dx
impact: med
effort: low
site: README.md › # Linked Mode
---

# Fix the README's express sample and give `linked: false` a worked example

The only server example in the README cannot parse, cannot run once it parses, and sends nothing once it runs: its `app.get("/", ...)` callback closes with `);` and no `}`, it imports `{ createServer } from "vite"` but calls `createViteServer(...)`, it calls `express()` without importing it, it omits `appType: "custom"` so Vite's default `spa` app type appends `indexHtmlMiddleware` and `notFoundMiddleware` to `vite.middlewares` and answers every request `404` with an empty body before the route runs, and `template.render({ hello: "world" }, res)` is Marko 5's two-argument signature that Marko 6 ignores, leaving the response open until something calls `.pipe(res)`. Since this is the one setup a linked-mode reader can copy, every one of those has to be rediscovered by hand. Two more stale spots sit in the same file: `### options.runtimeId` explains the option in terms of `window.$components`, a name no Marko 6 runtime uses (both key off `runtimeId`, whose default is `DEFAULT_RUNTIME_ID`), and the `linked: false` link under `# Linked Mode` points at `#options.linked` while GitHub slugs that heading `#optionslinked`, so it lands nowhere. Port the working equivalent from website/docs/introduction/installation.md, repair the anchor and the `$components` sentence, and give `### options.linked` a worked `linked: false` config, a thing that appears in no page of this README, the website docs, either cheatsheet, or marko-js/examples beyond a one-line aside in website/docs/reference/lazy-loading.md.

Check: copy the fenced `js` block under `# Linked Mode` into `/tmp/sample.mjs` and run `node --check /tmp/sample.mjs`; it prints `SyntaxError: Unexpected token ')'`. Repair only the missing `}`, the `createViteServer` name and the express import, run it, and `curl -i http://localhost:3000/` returns `HTTP/1.1 404 Not Found` with `Content-Length: 0` while the route body never executes; adding `appType: "custom"` reaches the route, which then never responds. `node -e 'console.log(new (require("github-slugger").default)().slug("options.linked"))'` prints `optionslinked`.
