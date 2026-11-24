---
"@marko/vite": patch
---

Import the templates an eager `import.meta.glob` matches by a relative path on Windows, rather than an absolute `D:/…` path that the compiler can't resolve.
