export const ssr = true;
export function steps() {
  for (const el of browser.window.document.querySelectorAll<HTMLElement>(
    ".clickable",
  )) {
    el.click();
  }
}
