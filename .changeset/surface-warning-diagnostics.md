---
"@marko/vite": patch
---

Marko compile warnings are now printed to the dev/build terminal as `[marko] warning: <file>:<line> <message>`, once per file and source version. Previously warning diagnostics were only visible to editors via the language server.
