---
"@marko/vite": patch
---

Compile `.marko` modules whose id carries an unrecognized query, such as the marker `@vitest/coverage-*` appends when it pulls in files no test imported, which previously reached the coverage instrumenter as uncompiled Marko source. Queries that change what the module is (`?raw`, `?url`, `?inline`, ...) are still left for vite to serve.
