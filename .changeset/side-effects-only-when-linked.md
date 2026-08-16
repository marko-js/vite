---
"@marko/vite": patch
---

Only apply the client build's side effect free default when linked. Unlinked consumers such as Storybook and vitest supply their own entries, whose modules run for their side effects, so tree-shaking them broke those setups (eg a static Storybook lost the addon channel setup and composed refs never finished loading).
