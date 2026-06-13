import type { Options } from "../../..";

export const ssr = true;
// The tags translator reports a runtime version with `linkAssets` support,
// so this fixture exercises the compiler's built-in asset orchestration
// (page entries compiled with `entry: "page"` and the lazily loaded child
// flowing through `linkAssets.onAsset` + the plugin's flush runtime).
export const options: Options = {
  translator: "@marko/runtime-tags/translator",
};
export const steps = [
  () => {
    browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
  },
  () => {
    browser.window.document
      .querySelector<HTMLElement>("#lazy-clickable")!
      .click();
  },
];
