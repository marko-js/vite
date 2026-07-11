---
"@marko/vite": patch
---

When a coding agent is driving the terminal (detected via the env markers agents set, e.g. `CLAUDECODE`, `CURSOR_AGENT`, `GEMINI_CLI`, `AI_AGENT`) and the installed marko package ships an LLM syntax reference, compile errors now end with a fix-guide pointer: "Fix guide: READ node_modules/marko/cheatsheet.md before writing a fix." Projects whose marko version does not ship `cheatsheet.md` — and all human-driven terminals — are unaffected.
