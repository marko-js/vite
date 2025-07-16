---
"@marko/vite": patch
---

Fix regression where asset list was calculated at module load time instead of render time. This change caused arc to be unable to lazily determine assets based on flag sets.
