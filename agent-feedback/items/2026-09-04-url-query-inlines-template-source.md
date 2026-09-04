---
type: bug
impact: med
effort: med
site: src/query.ts › hasOpaqueQuery
---

# Keep `?url` on a `.marko` consistent between dev and build; the build inlines the uncompiled source

`hasOpaqueQuery` deliberately leaves a template carrying `?url` uncompiled so Vite can serve it, and in dev that works — the import evaluates to a servable path like `/src/components/counter.marko`. In a build it does not: `.marko` is not in Vite's `assetsInclude`, so instead of emitting a file and returning its URL, Vite base64-inlines the file as `data:application/octet-stream;base64,…`. The value is unusable as a URL for anything that fetches it, carries a generic octet-stream MIME, and puts the raw template source — `class {}` body, `style {}` block and all — into the shipped server bundle. `?raw` is consistent across dev and build, so `?url` is the only divergent case. Either add `.marko` to `assetsInclude` so `?url` emits a real asset, or reject `?url` on a template with a message naming `?raw`.

Check: `import src from "./counter.marko?url"` in a template, render it, and compare `vite dev` against `vite build --app`; dev gives `/src/components/counter.marko` while the built server chunk matches `grep -ao 'data:application/octet-stream;base64,[A-Za-z0-9+/=]\{40,\}'`, which base64-decodes to the template's source text.
