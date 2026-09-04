---
type: bug
impact: med
effort: low
site: src/index.ts › load
---

# Keep the server template's source out of the public client sourcemap

With `build.sourcemap` on, the client bundle's `.js.map` — written into `dist/client/assets` and pointed at by a `//# sourceMappingURL` comment — carries a `sources` entry for `<name>.client-entry.marko` whose `sourcesContent` is the entire original template, byte for byte: `<server-only>` subtrees, server-side `?inline`/`?raw`/`?url` imports and all. The `load` hook's `InternalFileKind.clientEntry` branch hands Rollup the raw template read from disk as that module's code, and `sourcesContent` comes from the load result, so returning an empty transform map does not help. The embedded source is not even useful: compiling the template with `output: "hydrate"` yields nine lines (eight imports plus `init()`) and a null map, so Rollup assumes an identity transform and the only two mapping segments that reference it both point at the wrong lines. The project already treats browser-facing maps as a leak surface — see `stripSourceRoot` — so this is the same concern with a bigger payload. Hand `load` something that reflects what the client entry actually is, or scrub these sources in the existing `marko-vite:post` `generateBundle`.

Check: in a fixture with `build.sourcemap: true`, add `$ const DB_QUERY = "SELECT secret FROM users"` to a template and run `npx vite build --app`; the string is absent from `dist/client/assets/*.js` and present verbatim in the served `.js.map`. `node -e 'const fs=require("fs"),d="dist/client/assets/",f=d+fs.readdirSync(d).find(n=>n.endsWith(".js.map")),m=JSON.parse(fs.readFileSync(f,"utf8")),i=m.sources.findIndex(s=>s.endsWith(".client-entry.marko"));console.log(m.sourcesContent[i]===fs.readFileSync("src/template.marko","utf8"))'` prints `true`.
