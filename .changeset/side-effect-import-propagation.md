---
"@marko/vite": patch
---

Carry a template's explicit bare `import "x"` side effect marking downstream to the modules `x` itself imports. Previously only `x` was exempt from the client build's side effect free default, so a package whose effect lives in a module it bare-imports (eg terser installing `AST_Toplevel#resolve_defines` from `import "./global-defs.js"`) still had that module shaken out. Marko files, styles and assets remain non-propagating, so a template's own imports stay shakeable.
