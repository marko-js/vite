import type { Options } from "../../..";

export const ssr = true;
export function steps() {
  browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
}
export const options: Options = {
  basePathVar: "assetsPath",
};
