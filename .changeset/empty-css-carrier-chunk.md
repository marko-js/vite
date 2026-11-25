---
"@marko/vite": patch
---

Remove client chunks left holding only `import` statements once their css modules' stylesheets are extracted, instead of preloading them on every page that shares the stylesheet.
