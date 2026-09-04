---
type: bug
impact: med
effort: low
site: src/index.ts › Options
---

# Pass `options.translator` to the compiler, or drop it; today it does not override the translator

`Options.translator` is annotated "Overrides the Marko translator being used", but `opts.translator` reaches only two call sites: `supportsLinkAssets(opts.translator)`, which picks the asset-injection runtime, and `compiler.getRuntimeEntryFiles("dom", opts.translator)`, which fills `optimizeDeps.include`. It is never copied into `baseConfig`, the object handed to the compiler, so compilation keeps whatever translator `@marko/compiler` selected on its own — which it does by scanning the project's `package.json` for a dependency matching `@marko/runtime-*` or `marko-runtime-*`. The option is therefore the first knob anyone reaches for when mixing class-API and tags-API templates, it silently does nothing, and the thing that actually decides translation is the name of a dependency. Either thread it into `baseConfig` or remove it and say in the README what really selects the translator.

Check: `grep -n 'translator' src/index.ts` returns only the `Options` declaration, `supportsLinkAssets(opts.translator)` and `getRuntimeEntryFiles("dom", opts.translator)`; `baseConfig` in `config` has no `translator` key. Setting `marko({ translator: "@marko/translator-tags" })` on a class-API project changes neither the compiled output nor the compile errors.
