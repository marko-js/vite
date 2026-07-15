import type { Options } from "../../..";

export const ssr = true;
// Class API (marko 5) + linkAssets + a custom runtimeId (used when multiple
// Marko copies share a page). Guards that SSR components still hydrate: the
// server must serialize under the same `$<runtimeId>_C` key the client reads.
export const options: Options = {
  translator: "marko/translator",
  runtimeId: "M_20a04ad2",
};
export const steps = [
  () => {
    browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
  },
];
