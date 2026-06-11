export const ssr = true;
export function steps() {
  browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
}

export const env = {
  BASE_URL: "/some/base/path/",
};
