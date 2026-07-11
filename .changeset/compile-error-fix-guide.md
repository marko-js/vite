---
"@marko/vite": patch
---

Append a fix-guide pointer to compile errors when the installed Marko runtime ships an LLM syntax reference: errors now end with "Fix guide: READ node_modules/marko/llms.md (Marko 6 syntax) before writing a fix." The line only appears when `marko/llms.md` resolves from the project (Marko 5 projects, which do not ship the file, are unaffected), and only on the vite dev/build surface (editors and the language server are untouched). In controlled testing with weak coding agents repairing broken apps, this exact imperative wording moved sheet consultation from 8/44 to 41/44 and repaired-to-pass from 5/44 to 27/44 versus an informational reference line.
