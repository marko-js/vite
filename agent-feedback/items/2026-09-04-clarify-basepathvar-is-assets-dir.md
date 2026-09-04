---
type: dx
impact: med
effort: low
site: README.md › ### options.basePathVar
---

# Say that `basePathVar` names a variable holding the assets-directory URL, not the site base

The section shows `globalThis.__MY_ASSET_BASE_PATH__ = getAssetUrl(); // Note this must end with a /`, which reads as the deploy base — `/shop/` for a site mounted at `/shop/`. It is not: the `renderBuiltUrl` hook the option installs calls `trimAssertsDir` on every emitted filename, stripping `build.assetsDir` from it, so the manifest holds bare filenames and the runtime concatenates `base + "logo-<hash>.svg"`. `basePathVar` is the identifier of a global the app sets at runtime, and the correct value to put in that global is `<base><assetsDir>/`, not the site base. Getting it wrong is silent — the guards emitted by `src/link-assets.ts` and `src/render-assets-runtime.ts` check only that the value is a string ending in `/` — so the page renders and every asset 404s. Worth two more sentences in the same place: `build.assetsDir` is part of the value, and because the injected `<script type="module">` and stylesheet `<link>` tags carry `crossorigin`, an asset host on another origin must send `Access-Control-Allow-Origin` or the browser drops styles and scripts with only a console message.

Check: build with `marko({ basePathVar: "__ASSET_BASE__" })` and `grep __ASSET_BASE__ dist/server/*.js`; the emitted expression is `__ASSET_BASE__ + "logo-<hash>.svg"` with no `assets/` segment. Setting the variable to `/shop/` serves a page whose asset URLs all 404; `/shop/assets/` serves them.
