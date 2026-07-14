---
"@marko/vite": patch
---

Fix a spurious `Sourcemap for "<template>.marko-virtual.scss" points to missing source files` warning in dev when a `.marko` template has a `<style>` block. The dep optimizer compiled templates with `sourceMaps: "inline"`, which drops the extracted style block's separate sourcemap; the shared compiler cache then left the dev server serving the virtual CSS with no map to trace back to its template, so the style preprocessor emitted a self-referential map to the (non-existent) virtual file. The optimizer now uses `sourceMaps: "both"` so the separate map is retained, and the entry compile configs no longer force `sourceMaps: false` (the compiler now skips the entry wrapper's own map on its side), so CSS sourcemaps survive.
