export const patchImportId = "@marko/vite/patch";
export const patchRuntimeId = "\0marko-patch.mjs";

// The browser's `patch`, from the runtime the templates compile against.
export function getPatchClientRuntime(runtime: string): string {
  return `export { patch } from ${JSON.stringify(runtime)};\n`;
}

// The server's request check and response headers. A dev server names its
// build at once; a build's id is appended to the chunk once the browser build
// is hashed (`__MARKO_PATCH_BUILD__`), so the first request reads it. Both ids
// are base36 or base64url, as the headers they travel in require.
export function getPatchServerRuntime(runtime: string, build?: string): string {
  const from = JSON.stringify(runtime);
  return build
    ? `import { setPatchBuild } from ${from};
setPatchBuild(${JSON.stringify(build)});
export { PatchRequestKind, patchRequestKind, patchResponseHeaders } from ${from};
`
    : `import { setPatchBuild, patchRequestKind as requestKind } from ${from};
export { PatchRequestKind, patchResponseHeaders } from ${from};
let named;
export function patchRequestKind(headers, url) {
  named ||= (setPatchBuild(__MARKO_PATCH_BUILD__), 1);
  return requestKind(headers, url);
}
`;
}
