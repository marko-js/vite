export const renderAssetsRuntimeId = "\0marko-render-assets.mjs";
export function getRenderAssetsRuntime(opts: {
  isBuild: boolean;
  runtimeId?: string;
  basePathVar?: string;
}): string {
  return `${
    opts.basePathVar && opts.isBuild
      ? `const base = globalThis.${opts.basePathVar};
if (typeof base !== "string") throw new Error("${opts.basePathVar} must be defined when using basePathVar.");
if (!base.endsWith("/")) throw new Error("${opts.basePathVar} must end with a '/' when using basePathVar.");`
      : "const base = import.meta.env.BASE_URL;"
  }
export function addAssets(g, newEntries) {
  const entries = g.___viteEntries;
  if (entries) {
    g.___viteEntries = entries.concat(newEntries);
    return true;
  }
  g.___viteEntries = newEntries;
  g.___viteRenderAssets = renderAssets;
  g.___viteInjectAttrs = g.cspNonce
    ? \` nonce="\${g.cspNonce.replace(/"/g, "&#39;")}"\`
    : "";
  g.___viteSeenIds = new Set();
  ${opts.runtimeId ? `g.runtimeId = ${JSON.stringify(opts.runtimeId)};` : ""}
}

function renderAssets(slot) {
  const entries = this.___viteEntries;
  let html = "";

  if (entries) {
    const seenIds = this.___viteSeenIds;
    const slotWrittenEntriesKey = \`___viteWrittenEntries-\${slot}\`;
    const lastWrittenEntry = this[slotWrittenEntriesKey] || 0;
    const writtenEntries = (this[slotWrittenEntriesKey] = entries.length);

    if(!this.___flushedMBP && slot !== "head-prepend") {
        this.___flushedMBP = true;

        html += \`<script\${this.___viteInjectAttrs}>${
          opts.runtimeId ? `$mbp_${opts.runtimeId}` : "$mbp"
        }=\${JSON.stringify(base)}</script>\`
    }

    for (let i = lastWrittenEntry; i < writtenEntries; i++) {
      let entry = entries[i];

      if (typeof entry === "string") {
        entry = __MARKO_MANIFEST__[entry] || {};
      }${
        opts.isBuild
          ? ""
          : ` else if (slot === "head") {
        // In dev mode we have is a list entries of the top level modules that need to be imported.
        // To avoid FOUC we will hide the page until all of these modules are loaded.
        const { preload } = entry;
        if (preload) {
          html += \`<script class=marko-vite-preload async blocking=render type=module\${this.___viteInjectAttrs}>\`;
          for (const id of preload) {
            html += \`import \${JSON.stringify(base + id)};\`;
          }

          html += "document.querySelectorAll('.marko-vite-preload').forEach((el) => el.remove());";
          html += "document.documentElement.style.visibility='';";
          html +=
            "if(document.documentElement.getAttribute('style')==='')document.documentElement.removeAttribute('style');";
          html += \`</script><script class=marko-vite-preload\${this.___viteInjectAttrs}>document.documentElement.style.visibility='hidden'</script>\`;
        }
      }`
      }

      const parts = entry[slot];

      if (parts) {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          switch (part) {
            case 0: /** InjectType.AssetAttrs */
              html += this.___viteInjectAttrs;
              break;
            case 1: /** InjectType.PublicPath */
              html += base;
              break;
            case 2: /** InjectType.Dedupe */ {
              const id = parts[++i];
              const skipParts = parts[++i];
              if (seenIds.has(id)) {
                i += skipParts;
              } else {
                seenIds.add(id);
              }
              break;
            }
            default:
              html += part;
              break;
          }
        }
      }
    }
  }

  return html;
}
`;
}
