---
"@marko/vite": patch
---

Recompile every template whose output follows an edited one in dev, not only the templates that read it directly: a template's output also follows what its child templates read (a grandchild's `<return>` decides its parent's tag variable), so an edit invalidates each template listing it in `analyzedTags`, then each listing those.
