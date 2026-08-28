---
type: dx
impact: low
effort: low
site: README.md › # Linked Mode
---

# Say in the README that `$global.cspNonce` is applied to the asset tags linked mode injects

Linked mode already nonces the tags it injects, and no doc says so, so a reader wiring a strict CSP over it has to render a page and read the markup to find out whether the injected assets are covered. `src/serializer.ts` pushes an `InjectType.AssetAttrs` slot on every `<script>`, every `<style>` and every `<link>` whose `rel` is `stylesheet` or `modulepreload` or whose `as` is `style` or `script`, and `src/link-assets.ts` plus `src/render-assets-runtime.ts` expand that slot to ` nonce="…"` whenever `g.cspNonce` is set. The README mentions neither `nonce` nor CSP anywhere, and website/docs/reference/template.md's `### $global.cspNonce` section enumerates only the tags the Marko runtime itself renders (`<html-script>`/`<html-style>`, the `<style>` rendered for a `<style>` tag with dynamic values, and the stream and resume inline scripts), an enumeration whose members are all `<script>` or `<style>` elements. Add a sentence under `# Linked Mode` naming the script, style and stylesheet/modulepreload `<link>` tags the plugin nonces, and a clause in that template.md section pointing at it. Keep the wording to those kinds: other `<link>` rels deliberately get no slot, since a nonce is inert there.

Check: in a linked-mode app built with `vite build --app`, render with `Template.render({ $global: { cspNonce, serializedGlobals: ["cspNonce"] } }).pipe(res)` and `curl -s http://localhost:<port>/ | grep -o '<[a-z]*[^>]*nonce="[^"]*"[^>]*>'`; the injected `<link rel="stylesheet">`, `<link rel="modulepreload">` and `<script type="module">` all carry the nonce from the response's `Content-Security-Policy`. `grep -in 'nonce\|csp' README.md` exits 1 with no output.
