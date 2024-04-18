---
"@marko/vite": patch
---

Fix issue when a Marko server entry is loaded inside of another chunk which caused the assets injection runtime to be in a different chunk than the server entry (since it will codesplit the runtime). This change now ensures the asset manifest is only ever injected into chunks that reference the assets runtime injector.
