import assert from "assert";

import type { Options } from "../../..";

function hasScript(pattern: RegExp) {
  for (const el of browser.window.document.querySelectorAll("head > script")) {
    if (pattern.test(el.innerHTML)) {
      return true;
    }
  }
  return false;
}

export const ssr = true;
export function steps() {
  assert(
    hasScript(/\$mbp[a-z0-1-_\s]*=/i),
    "Base path script not found in head",
  );
  browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
}
export const options: Options = {
  basePathVar: "assetsPath",
};
