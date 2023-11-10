export const renderAssetsRuntimeId = "\0marko-render-assets.mjs";
export function getRenderAssetsRuntime(opts: {
  isBuild: boolean;
  runtimeId?: string;
  basePathVar?: string;
}): string {
  return `${
    !opts.basePathVar
      ? "const base = import.meta.env.BASE_URL;"
      : `const base = globalThis.${opts.basePathVar};
if (typeof base !== "string") throw new Error("${opts.basePathVar} must be defined when using basePathVar.");
if (!base.endsWith("/")) throw new Error("${opts.basePathVar} must end with a '/' when using basePathVar.");`
  }
export function addAssets(g, newEntries) {
  const entries = g.___viteEntries;
  if (entries) {
    g.___viteEntries = entries.concat(newEntries);
  } else {
    g.___viteEntries = newEntries;
    g.___viteRenderAssets = renderAssets;
    g.___viteInjectAttrs = g.cspNonce
      ? \` nonce="\${g.cspNonce.replace(/"/g, "&#39;")}"\`
      : "";
    ${
      opts.runtimeId ? `$ g.runtimeId = ${JSON.stringify(opts.runtimeId)};` : ""
    }
  }
}

function renderAssets(slot) {
  const entries = this.___viteEntries;
  let html = "";

  if (entries) {
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
          let sep = "";
          html += \`<script\${this.___viteInjectAttrs}>((root=document.documentElement)=>{\`;
          html += "root.style.visibility='hidden';";
          html += "document.currentScript.remove();";
          html += "Promise.allSettled([";

          for (const id of preload) {
            html += \`\${sep}import(\${JSON.stringify(base + id)})\`;
            sep = ",";
          }

          html += "]).then(()=>{";
          html += "root.style.visibility='';";
          html +=
            "if(root.getAttribute('style')==='')root.removeAttribute('style')";
          html += "})})()</script>";
        }
      }`
      }

      const parts = entry[slot];

      if (parts) {
        for (const part of parts) {
          html +=
            part === 0 /** InjectType.AssetAttrs */
              ? this.___viteInjectAttrs
              : part === 1 /** InjectType.PublicPath */
              ? base
              : part;
        }
      }
    }
  }

  return html;
}
`;
}
