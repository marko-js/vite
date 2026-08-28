---
type: dx
impact: low
effort: low
site: src/manifest-generator.ts › getPreventFOUCParts
---

# Document the dev-only `marko-vite-preload` FOUC guard and its no-JS consequence

In dev, linked mode prepends a guard to every flushed asset group: `getPreventFOUCParts` emits `<style marko-vite-preload="<id>">html{visibility:hidden !important}</style>` plus an inline `async blocking=render type=module` script that awaits the entry modules and then removes both nodes. The mechanism is deliberate and dev-only by construction, but `marko-vite-preload`, `visibility:hidden` and `FOUC` appear in no README, website page or cheatsheet, so two consequences arrive unannounced. With JavaScript disabled, every dev page is blank, `document.documentElement` computing to `visibility: hidden` with the guard nodes still in the document, which reads as a broken app to anyone testing the promise in website/docs/explanation/targeted-compilation.md that Marko applications function completely without JavaScript. A whole-document comparison of served HTML against the hydrated DOM in dev also shows those two nodes as a delta that a production build does not produce, which sends people hunting a hydration mismatch. Add a sentence under README.md's `# Linked Mode` and in the marko-run `dev` docs naming the guard, the `marko-vite-preload` attribute to grep for, and its dev-only scope; emitting a `<noscript><style>html{visibility:visible !important}</style></noscript>` sibling would also make no-JS dev pages render.

Check: run `marko-run dev` on an app, then `curl -s http://localhost:<port>/<route> | grep -o '<style marko-vite-preload[^>]*>[^<]*</style>'` prints `<style marko-vite-preload="dist_.marko-run_report.marko">html{visibility:hidden !important}</style>`, and `grep -ci noscript` on the same document prints 0. Loading that url with `javaScriptEnabled: false` reports `visibility` `hidden`, 2 guard nodes and an invisible `<h1>`; after `marko-run build && marko-run preview` the same route has no `marko-vite-preload` and reports `visibility` `visible`. `grep -rn -i 'marko-vite-preload\|visibility:hidden\|FOUC' README.md` exits 1.
