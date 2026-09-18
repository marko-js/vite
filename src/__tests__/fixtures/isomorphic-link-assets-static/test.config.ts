import type { Options } from "../../..";

export const ssr = true;
// A lazily loaded template with a stylesheet but no client code: its
// client chunk is pure css, which vite prunes, so its stylesheet has to be
// linked with the html it styles (a full load paints unstyled otherwise).
export const options: Options = {
  translator: "@marko/runtime-tags/translator",
};
export const steps = [
  () => {
    browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
  },
];
