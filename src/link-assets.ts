import * as compiler from "@marko/compiler";

import { getPreventFOUCParts } from "./manifest-generator";

/**
 * Integration with the Marko compiler's built-in asset orchestration
 * (the `linkAssets`/`entry` compiler options added alongside the `version`
 * and `getRuntimeVersion` compiler exports).
 *
 * When the resolved translator supports it, the compiler takes over the
 * work this plugin previously did by hand: it generates the server entry
 * wrapper (`withPageAssets`), flushes assets before `</head>`, and reports
 * page/lazy-load entry points through `linkAssets.onAsset`. This plugin
 * then only needs to provide the `linkAssets.runtime` module (the `flush`
 * implementation below) and map asset ids to built/served assets.
 *
 * Everything specific to the new API lives in this module so that once the
 * legacy asset orchestration (render-assets-runtime, render-assets-transform,
 * server-entry-template and the related branches in index.ts) is removed,
 * the seams are easy to find.
 */

// The translator (runtime) versions that first support the `linkAssets` and
// `entry` compiler options (including applying the `runtimeId` option through
// the generated `withPageAssets` server entry wrapper): marko@5.39.5 for the
// class runtime (5.39.3 shipped the feature, but its translator only reports
// a version from 5.39.4 and its page/load wrappers recurse under hot reload
// before 5.39.5) and marko@6.1.4 (runtime-tags) for the tags runtime. Any
// later major is assumed to support it.
const minRuntimeVersions: Record<number, readonly [number, number, number]> = {
  5: [5, 39, 5],
  6: [6, 1, 4],
};

export const linkAssetsRuntimeId = "\0marko-link-assets.mjs";

/**
 * Stable importable alias for the runtime module above, for tooling built on
 * this plugin (e.g. @marko/run's persisted-pages imports `buildId` from it).
 * Resolved by the plugin in dev and build.
 */
export const linkAssetsPublicId = "virtual:marko-vite/link-assets";

export function supportsLinkAssets(translator?: string): boolean {
  // Both exports were added in the same release as the `linkAssets` option
  // (@marko/compiler@5.39.64), so their absence at runtime means the
  // installed compiler is too old (the peer range allows older compilers).
  const { version, getRuntimeVersion } = compiler as Partial<typeof compiler>;
  if (!version || !getRuntimeVersion) return false;

  const [major = 0, minor = 0, patch = 0] = getRuntimeVersion(translator)
    .split(".")
    .map((part) => parseInt(part, 10));
  const min = minRuntimeVersions[major];
  if (!min) return major > 6;
  return minor > min[1] || (minor === min[1] && patch >= min[2]);
}

/**
 * Builds the code injected into a compiled module to register the dev asset
 * manifest entry for an asset id with the runtime module below (page entries
 * register their document manifest, lazily loaded templates register their
 * dev load entry script tag). Since the registration runs at module scope in
 * the SSR environment itself, it works regardless of where that environment
 * runs and always executes before a render can flush assets. `entry` is a
 * code expression.
 */
export function getRegisterAssetsCode(assetId: string, entry: string): string {
  return `\nimport { register as __marko_vite_register__ } from ${JSON.stringify(
    linkAssetsRuntimeId,
  )};\n__marko_vite_register__(${JSON.stringify(assetId)}, ${entry});`;
}

/**
 * Builds the manifest entry for a lazily loaded (`import ... with { load }`)
 * asset in dev. In dev css is loaded through the entry's js module, so the
 * assets are all render blocking: the page is hidden until the dev server
 * module for the load entry has been imported (which applies its css and
 * signals hydration readiness). `url` must be relative to the base path (no
 * leading slash).
 */
export function getDevLoadAssetsManifest(url: string) {
  return { block: getPreventFOUCParts([url], url) };
}

export function getLinkAssetsRuntime(opts: {
  buildId: string;
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
const registered = {};

export function register(assetId, entry) {
  registered[assetId] = entry;
}

// Identifies the client bundle so servers can reject incompatible updates.
export function buildId() {
  return ${JSON.stringify(opts.buildId)};
}

export function flush(g, type, assetId) {
  let html = "";

  if (!g.___viteSeenIds) {
    g.___viteSeenIds = new Set();
    g.___viteInjectAttrs = g.cspNonce
      ? \` nonce="\${g.cspNonce.replace(/"/g, "&#39;")}"\`
      : "";
    ${
      opts.basePathVar
        ? `html += \`<script\${g.___viteInjectAttrs}>${
            opts.runtimeId ? `$mbp_${opts.runtimeId}` : "$mbp"
          }=\${JSON.stringify(base)}</script>\`;`
        : ""
    }
  }

  const entry = ${
    opts.isBuild
      ? `typeof __MARKO_MANIFEST__ === "undefined"
    ? undefined
    : __MARKO_MANIFEST__[assetId]`
      : `registered[assetId]`
  };
  if (entry) {
    html += renderParts(g, type === "block" ? entry.block : entry.defer);
  }

  return html;
}

function renderParts(g, parts) {
  let html = "";

  if (parts) {
    const seenIds = g.___viteSeenIds;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      switch (part) {
        case 0: /** InjectType.AssetAttrs */
          html += g.___viteInjectAttrs;
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

  return html;
}
`;
}
