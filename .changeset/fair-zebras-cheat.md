---
"@marko/vite": patch
---

Fix issue in dev mode where render blocking was lasting longer than necessary due to a deferred module script. The script is now marked as async.
