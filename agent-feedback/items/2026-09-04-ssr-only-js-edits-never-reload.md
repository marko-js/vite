---
type: bug
impact: med
effort: med
site: src/index.ts › hotUpdate
---

# Reload the browser when a template's server-only JS import changes; today the tab silently goes stale

`hotUpdate`'s only browser-directed reload is the `devServer.hot.send({ type: "full-reload" })` guarded by `if (previous.size)`, and `previous` is built from `ssrTransformCache`, which `transform` writes only for `.marko`-derived SSR modules. So a plain `.js` module that a template imports — reachable through the SSR graph but absent from the client graph — never reaches that branch: editing it produces zero websocket payloads, the open tab keeps rendering the old value, and there is no browser console error. The next SSR render already has the new value, so the page is stale only for whoever is looking at it. This is more reachable in Marko than in a plain Vite app, because one `.marko` source compiles into two environment-specific modules and a non-reactive `${LABEL}` drops the import from the client build entirely, making an import the author wrote in the template silently server-only. Vite core does decide `needFullReload` here, but sends it on the ssr environment's hot channel, which no browser is attached to, so the plugin is the layer that has to bridge it — as it already does for `.marko`.

Check: a `page.marko` doing `import { LABEL } from "./data.js"` and rendering `${LABEL}`; hold `new WebSocket("ws://localhost:<port>/", "vite-hmr")` open, edit `data.js`, wait 2.5s. The socket receives nothing while the server logs `[vite] (ssr) page reload src/data.js` and a fresh `curl` already shows the new value. Editing `page.marko` instead sends `{"type":"full-reload"}`.
