import type { Options } from "../../..";

export const ssr = true;
// Exercises a lazily loaded (`import ... with { load }`) template guarded by
// a trigger: in production its render blocking assets (css) flush inline
// with the server rendered html while the deferred assets (the load entry
// script) are only injected once the trigger fires, gating hydration. In
// dev all assets are render blocking, so the lazy template hydrates eagerly
// without the trigger.
export const options: Options = {
  translator: "@marko/runtime-tags/translator",
};
export const steps = [
  () => {
    browser.window.document.querySelector<HTMLElement>("#load-lazy")!.click();
  },
  () => {
    browser.window.document
      .querySelector<HTMLElement>("#lazy-clickable")!
      .click();
  },
];
