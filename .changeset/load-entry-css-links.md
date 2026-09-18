---
"@marko/vite": patch
---

Link the stylesheets of a lazily loaded template that has no client code. Its client chunk is pure css, which vite prunes before the plugin collected the css to flush with the template's html, so the stylesheet only arrived once the module script ran and the html painted unstyled until then.
