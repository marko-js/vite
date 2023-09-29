---
"@marko/vite": major
---

When using a runtime base path via the `basePathVar` option the vite [build.assetsDir](https://vitejs.dev/config/build-options.html#build-assetsdir) is now stripped from the final url. (You could add this back manually yourself if desired).
