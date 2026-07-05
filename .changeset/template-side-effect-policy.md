---
"@marko/vite": minor
---

Production client builds treat imports from templates as pure unless
explicitly side-effect-only: library packages tree-shake well from Marko
apps without declaring `sideEffects` themselves. A named-but-unused
import (and unused module init code behind it) drops; a bare import
(`client import "./client-init"`) is author intent and stays
side-effectful even over a package's own pure declaration; `.marko`
targets keep their registration side effects, and non-JS assets keep
their defaults (css rides its bare import). Non-template importers are
untouched, so JS-to-JS semantics (polyfills in plain entries,
library-internal imports) keep stock bundler behavior. Effects from a
template must be bare imports.
