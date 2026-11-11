---
"@marko/vite": patch
---

Keep the taglib and compile caches across template edits, and clear them only when tag discovery or a template's sibling files can change: when a template or class API tag entry file in a `tags` or `components` folder, or a template's `style.*`, `component.*` or `component-browser.*` file, is added or removed, or when a `marko.json`, `marko-tag.json` or `package.json` changes. Those changes now recompile every template (and its extracted files) and reload the page, so a template using a tag or component file that was just added or removed updates instead of keeping its old output.
