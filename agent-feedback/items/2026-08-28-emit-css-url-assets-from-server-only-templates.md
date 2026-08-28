---
type: bug
impact: med
effort: low
site: src/index.ts › generateBundle
---

# Emit css `?url` assets referenced only from server-rendered templates

An SSR build writes no assets, so `generateBundle`'s ssr branch collects asset module ids into `serverManifest.ssrAssetIds` and `transform` appends a side-effect `import` of each to the client entry, letting the client pass emit the files. The collector gates on `module?.meta["vite:asset"]`, which only Vite's `vite:asset` plugin sets, but `vite:css` is registered ahead of it and claims `*.css?url` in its own `load` hook, so a css `?url` module carries empty meta and never reaches `ssrAssetIds`. A `<link rel="stylesheet" media="print" href="./print.css?url">` in a server-only layout, which is exactly the spelling `# Browser asset references` in README.md prescribes to force a `.css` reference and exactly what `assetFileReg` in `src/relative-assets-transform.ts` matches, therefore compiles to a hashed `/assets/print-<hash>.css` href backed by no file: the build exits 0 with no warning and every request for that stylesheet 404s. A png referenced from the same `<link>` element in the same layout is emitted, which is why the `isomorphic-ssr-asset` fixture never caught this. Adding css `?url` ids to `ssrAssetIds` is not enough on its own, because the generated client-entry import is side-effect only and a css `?url` file is written only when its `__VITE_CSS_URL__` default export survives into a rendered chunk, so the fix has to reference the imported value or emit the file directly. Guard it with a fixture shaped like `isomorphic-relative-asset-import` whose `?url` stylesheet lives in a template that stays out of the client bundle.

Check: in a linked-mode SSR app with `build.ssrEmitAssets` left at its default and a server-only layout containing `<link rel="stylesheet" media="print" href="./print.css?url">`, run `NODE_ENV=production vite build --app`; it exits 0 with no warning, `grep -o 'assets/print-[A-Za-z0-9_-]*\.css' dist/index.js` prints the reference (`assets/print-SKKTRJpX.css`), `ls dist/assets | grep print` prints nothing, and `curl -i http://localhost:<port>/assets/print-SKKTRJpX.css` against the built server returns `HTTP/1.1 404 Not Found`. Control: a 120 KB png referenced as `<link rel="preload" as="image" href="./big.png">` from the same layout does land in `dist/assets` and serves 200.
