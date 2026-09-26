import type * as vite from "vite";

const preloadHelperReg = /^\0vite\/preload-helper\.js$/;
const seenCheckReg =
  /if\s*\(dep in seen\)\s*return;?\s*seen\[dep\]\s*=\s*true;?/;
const appendLinkReg = /document\.head\.appendChild\(link\);?/;

/**
 * Vite's preload helper only makes the dynamic import that inserts a
 * stylesheet wait for it to load. Another import needing that stylesheet while
 * it loads (eg a lazy template imported again) resolves early and renders
 * unstyled, so the pending load is shared with every caller until it settles.
 */
export default function preloadCssPlugin(): vite.Plugin {
  return {
    name: "marko-vite:preload-css",
    apply: "build",
    transform: {
      filter: { id: preloadHelperReg },
      handler(code) {
        return patchPreloadHelper(code);
      },
    },
  };
}

/**
 * Returns the helper with shared stylesheet loads, or `undefined` when its
 * code no longer has the shape this patches (eg Vite fixed it upstream).
 */
export function patchPreloadHelper(code: string): string | undefined {
  if (!seenCheckReg.test(code) || !appendLinkReg.test(code)) return;
  return (
    code
      .replace(
        seenCheckReg,
        "if (dep in seen) return seen[dep];\nseen[dep] = void 0;",
      )
      .replace(
        appendLinkReg,
        "$&\nif (isCss) seen[dep] = __markoCssLoad(link, dep, seen);",
      ) +
    `
function __markoCssLoad(link, dep, seen) {
  const loaded = new Promise((res, rej) => {
    link.addEventListener("load", res);
    link.addEventListener("error", () => rej(new Error(\`Unable to preload CSS for \${dep}\`)));
  });
  const settle = () => { seen[dep] = void 0; };
  loaded.then(settle, settle);
  return loaded;
}
`
  );
}
