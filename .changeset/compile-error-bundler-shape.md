---
"@marko/vite": patch
---

Report compile errors in the shape Vite and Rolldown print. An error in the template being transformed now carries a plain message plus `loc` and `frame`, so the terminal and overlay show `file:line:column` and a single code frame (including through the SSR module runner). An error from a template it analyzed keeps the compiler's own message, which names that file, instead of printing `undefined:undefined` and the frame twice.
